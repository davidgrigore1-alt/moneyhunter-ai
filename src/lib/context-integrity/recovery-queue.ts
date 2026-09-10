import type { Opportunity } from "@/lib/types";
import { buildOpportunityCommercialState } from "@/lib/opportunity-commercial-state";
import type {
  ContextIntegrityField,
  ContextIntegrityFindingKind,
  ContextIntegritySafeAction,
  ContextIntegritySeverity
} from "./types";

export const CONTEXT_INTEGRITY_RECOVERY_LIMITS = {
  findings: 64,
  opportunities: 100,
  visibleRows: 3
} as const;

export type ContextIntegrityRecoveryFinding = {
  id: string;
  businessId: string;
  opportunityId: string;
  kind: ContextIntegrityFindingKind;
  field: ContextIntegrityField;
  severity: ContextIntegritySeverity;
  state: "open" | "needs_review";
  safeAction: ContextIntegritySafeAction;
  firstDetectedAt: string;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
};

export type ContextIntegrityRecoveryItem = {
  opportunityId: string;
  opportunityTitle: string;
  organization: string;
  owner: string;
  estimatedValue: number | null;
  currency: string;
  findingCount: number;
  severity: ContextIntegritySeverity;
  primaryLabel: string;
  whyItMatters: string;
  safeActionLabel: string;
  firstDetectedAt: string;
  lastEvaluatedAt: string;
  ageDays: number;
  reviewHref: string;
};

export type ContextIntegrityRecoveryQueue = {
  items: ContextIntegrityRecoveryItem[];
  activeFindingCount: number;
  opportunityCount: number;
  highPriorityCount: number;
  oldestAgeDays: number | null;
  exposure: Record<string, number>;
  limited: boolean;
};

const severityRank: Record<ContextIntegritySeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  review: 1
};

const kindLabels: Record<ContextIntegrityFindingKind, string> = {
  source_association_mismatch: "Verifică asocierea documentului",
  entity_context_mismatch: "Verifică identitatea contextului",
  commercial_value_mismatch: "Verifică valoarea comercială",
  next_action_mismatch: "Verifică următorul pas",
  responsibility_mismatch: "Verifică responsabilul",
  execution_state_mismatch: "Verifică starea de execuție",
  insufficient_context_integrity: "Verifică informația lipsă"
};

const kindImpact: Record<ContextIntegrityFindingKind, string> = {
  source_association_mismatch:
    "Sursele asociate pot aparține unui alt context comercial. Verifică înainte ca informația să fie folosită în execuție.",
  entity_context_mismatch:
    "Identitatea observată în sursă nu este coerentă cu entitatea din contextul curent.",
  commercial_value_mismatch:
    "Valori comerciale comparabile diferă între sursele disponibile.",
  next_action_mismatch:
    "Sursele disponibile nu sunt coerente cu privire la următorul pas comercial.",
  responsibility_mismatch:
    "Responsabilitatea comercială diferă între sursele comparabile.",
  execution_state_mismatch:
    "Starea de execuție diferă între sursele comparabile.",
  insufficient_context_integrity:
    "Contextul disponibil nu este suficient pentru o concluzie sigură."
};

const safeActionLabels: Record<ContextIntegritySafeAction, string> = {
  review_association: "Revizuiește contextul",
  review_value: "Revizuiește valoarea",
  review_next_action: "Revizuiește următorul pas",
  review_responsibility: "Revizuiește responsabilul",
  review_execution_state: "Revizuiește execuția"
};

function validTime(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ageDays(firstDetectedAt: string, now: Date): number {
  const detected = validTime(firstDetectedAt);
  if (detected === null) return 0;
  return Math.max(0, Math.floor((now.getTime() - detected) / 86_400_000));
}

function highestSeverity(
  findings: ContextIntegrityRecoveryFinding[]
): ContextIntegritySeverity {
  return [...findings].sort(
    (left, right) =>
      severityRank[right.severity] - severityRank[left.severity] ||
      left.firstDetectedAt.localeCompare(right.firstDetectedAt) ||
      left.id.localeCompare(right.id)
  )[0]?.severity ?? "review";
}

function primaryFinding(
  findings: ContextIntegrityRecoveryFinding[]
): ContextIntegrityRecoveryFinding {
  return [...findings].sort(
    (left, right) =>
      severityRank[right.severity] - severityRank[left.severity] ||
      left.firstDetectedAt.localeCompare(right.firstDetectedAt) ||
      left.id.localeCompare(right.id)
  )[0];
}

/**
 * Pure projection of already-authorized persistent findings.
 * No model calls, scoring, provider reads, or mutations.
 *
 * Ordering is deliberately simple and explainable:
 * severity -> oldest unresolved case -> opportunity title.
 */
export function buildContextIntegrityRecoveryQueue(input: {
  businessId: string;
  opportunities: Opportunity[];
  findings: ContextIntegrityRecoveryFinding[];
  limited?: boolean;
  now?: Date;
}): ContextIntegrityRecoveryQueue {
  const now = input.now ?? new Date();
  const opportunities = new Map(
    input.opportunities
      .filter(
        (item) =>
          !item.businessId || item.businessId === input.businessId
      )
      .map((item) => [item.id, item])
  );

  const active = input.findings.filter((finding) => {
    if (finding.businessId !== input.businessId) {
      throw new Error("context_integrity_recovery_tenant_scope_forbidden");
    }
    return (
      (finding.state === "open" || finding.state === "needs_review") &&
      opportunities.has(finding.opportunityId)
    );
  });

  const byOpportunity = new Map<
    string,
    ContextIntegrityRecoveryFinding[]
  >();

  for (const finding of active) {
    const group = byOpportunity.get(finding.opportunityId) ?? [];
    group.push(finding);
    byOpportunity.set(finding.opportunityId, group);
  }

  const items: ContextIntegrityRecoveryItem[] = [];

  for (const [opportunityId, findings] of Array.from(
    byOpportunity.entries()
  )) {
    const opportunity = opportunities.get(opportunityId);
    if (!opportunity || !findings.length) continue;

    const state = buildOpportunityCommercialState(opportunity, { now });
    if (state.lifecycle !== "open") continue;

    const primary = primaryFinding(findings);
    const severity = highestSeverity(findings);
    const firstDetectedAt = findings
      .map((item) => item.firstDetectedAt)
      .sort()[0];
    const lastEvaluatedAt = findings
      .map((item) => item.lastEvaluatedAt)
      .sort()
      .at(-1)!;

    const estimatedValue =
      state.financial.estimatedValue !== null &&
      Number.isFinite(state.financial.estimatedValue)
        ? state.financial.estimatedValue
        : null;

    items.push({
      opportunityId,
      opportunityTitle: state.title,
      organization: state.organization.name ?? "Companie neconfirmată",
      owner:
        state.ownership.ownerName ??
        (state.ownership.ownerProfileId
          ? "Responsabil atribuit"
          : "Fără responsabil"),
      estimatedValue,
      currency: state.financial.currency,
      findingCount: findings.length,
      severity,
      primaryLabel: kindLabels[primary.kind],
      whyItMatters: kindImpact[primary.kind],
      safeActionLabel: safeActionLabels[primary.safeAction],
      firstDetectedAt,
      lastEvaluatedAt,
      ageDays: ageDays(firstDetectedAt, now),
      reviewHref: `/opportunities/${encodeURIComponent(
        opportunityId
      )}?tab=context#context-integrity-review`
    });
  }

  items.sort(
    (left, right) =>
      severityRank[right.severity] - severityRank[left.severity] ||
      right.ageDays - left.ageDays ||
      left.opportunityTitle.localeCompare(right.opportunityTitle, "ro")
  );

  const exposure: Record<string, number> = {};
  for (const item of items) {
    if (item.estimatedValue === null) continue;
    exposure[item.currency] =
      (exposure[item.currency] ?? 0) + item.estimatedValue;
  }

  return {
    items,
    activeFindingCount: items.reduce(
      (sum, item) => sum + item.findingCount,
      0
    ),
    opportunityCount: items.length,
    highPriorityCount: items.filter(
      (item) => item.severity === "critical" || item.severity === "high"
    ).length,
    oldestAgeDays: items.length
      ? Math.max(...items.map((item) => item.ageDays))
      : null,
    exposure,
    limited: Boolean(input.limited)
  };
}
