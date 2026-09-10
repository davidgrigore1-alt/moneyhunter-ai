import type {
  CommercialStateEvidence,
  CommercialStateException,
  OpportunityCommercialState
} from "@/lib/opportunity-commercial-state";

export const EXECUTION_INTEGRITY_VERSION = "execution-integrity/1" as const;

export const EXECUTION_INTEGRITY_LIMITS = {
  findingsPerOpportunity: 8,
  evidenceRefs: 6,
  caseKey: 1024,
  findingKey: 2048,
  label: 180,
  explanation: 600,
  actionLabel: 120,
  actionHref: 600
} as const;

export type ExecutionIntegrityCode =
  | "overdue_next_action"
  | "missing_next_action"
  | "unassigned_owner"
  | "pending_approval"
  | "prepared_document_not_advanced";

export type ExecutionIntegritySeverity = "critical" | "attention";

export type ExecutionIntegrityEvidenceRef = {
  sourceType: CommercialStateEvidence["sourceType"];
  sourceId: string;
  label: string;
  observedAt: string | null;
  href: string;
};

export type ExecutionIntegrityFinding = {
  version: typeof EXECUTION_INTEGRITY_VERSION;
  businessId: string;
  opportunityId: string;
  caseKey: string;
  findingKey: string;
  code: ExecutionIntegrityCode;
  severity: ExecutionIntegritySeverity;
  sourceType: CommercialStateEvidence["sourceType"] | "opportunity";
  sourceId: string;
  label: string;
  explanation: string;
  safeActionLabel: string;
  safeActionHref: string;
  evidenceRefs: ExecutionIntegrityEvidenceRef[];
  evaluatedAt: string;
};

export type ExecutionIntegrityPersistenceCase = {
  id: string;
  businessId: string;
  opportunityId: string;
  caseKey: string;
  findingKey: string;
  code: ExecutionIntegrityCode;
  severity: ExecutionIntegritySeverity;
  state: "open";
  rowVersion: number;
  detectionCount: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
};

const supportedCodes = new Set<ExecutionIntegrityCode>([
  "overdue_next_action",
  "missing_next_action",
  "unassigned_owner",
  "pending_approval",
  "prepared_document_not_advanced"
]);

const priority: Record<ExecutionIntegrityCode, number> = {
  overdue_next_action: 100,
  missing_next_action: 90,
  unassigned_owner: 80,
  pending_approval: 70,
  prepared_document_not_advanced: 60
};

function bounded(value: string, max: number, field: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`execution_integrity_invalid_${field}`);
  }
  return normalized;
}

function encoded(parts: string[]) {
  return parts.map((item) => encodeURIComponent(item)).join("|");
}

function sourceFor(
  code: ExecutionIntegrityCode,
  state: OpportunityCommercialState
): { sourceType: ExecutionIntegrityFinding["sourceType"]; sourceId: string } | null {
  if (code === "overdue_next_action") {
    return state.nextAction
      ? { sourceType: "action", sourceId: state.nextAction.id }
      : null;
  }

  if (code === "pending_approval") {
    return state.approval.signalId
      ? { sourceType: "approval", sourceId: state.approval.signalId }
      : null;
  }

  if (code === "prepared_document_not_advanced") {
    return state.document.id
      ? { sourceType: "document", sourceId: state.document.id }
      : null;
  }

  return { sourceType: "opportunity", sourceId: state.opportunityId };
}

function snapshotParts(
  code: ExecutionIntegrityCode,
  state: OpportunityCommercialState,
  sourceId: string
) {
  if (code === "overdue_next_action") {
    return [
      sourceId,
      state.nextAction?.status ?? "missing",
      state.nextAction?.dueAt ?? "undated",
      state.nextAction?.ownerProfileId ?? "unowned"
    ];
  }

  if (code === "missing_next_action") {
    return [state.lifecycle, state.stage, "next_action:none"];
  }

  if (code === "unassigned_owner") {
    return [state.lifecycle, "owner:none"];
  }

  if (code === "pending_approval") {
    return [
      sourceId,
      `pending:${state.approval.pendingCount}`
    ];
  }

  return [
    sourceId,
    state.document.state
  ];
}

function severityFor(
  exception: CommercialStateException
): ExecutionIntegritySeverity {
  return exception.severity === "critical" ||
    exception.code === "overdue_next_action"
    ? "critical"
    : "attention";
}

function evidenceFor(
  exception: CommercialStateException,
  state: OpportunityCommercialState
): ExecutionIntegrityEvidenceRef[] {
  const ids = new Set(exception.evidenceIds);
  const refs = state.evidence
    .filter((item) => ids.has(item.id))
    .slice(0, EXECUTION_INTEGRITY_LIMITS.evidenceRefs)
    .map((item) => ({
      sourceType: item.sourceType,
      sourceId: bounded(item.sourceId, 256, "evidence_source_id"),
      label: bounded(item.label, 240, "evidence_label"),
      observedAt:
        item.observedAt && Number.isFinite(Date.parse(item.observedAt))
          ? item.observedAt
          : null,
      href: item.href.startsWith("/") ? item.href.slice(0, 600) : ""
    }));

  if (refs.length) return refs;

  return [
    {
      sourceType: "opportunity",
      sourceId: state.opportunityId,
      label: `Oportunitatea „${state.title}”`.slice(0, 240),
      observedAt: state.evaluatedAt,
      href: `/opportunities/${encodeURIComponent(state.opportunityId)}`
    }
  ];
}

/**
 * Deterministic execution-break detector.
 *
 * This does not decide whether a human "resolved" a problem. A finding
 * disappears only when the current commercial state no longer satisfies
 * the underlying rule under a complete evaluation.
 */
export function buildExecutionIntegrityFindings(
  state: OpportunityCommercialState
): ExecutionIntegrityFinding[] {
  if (state.lifecycle !== "open") return [];
  if (!state.businessId) {
    throw new Error("execution_integrity_business_scope_required");
  }

  const findings: ExecutionIntegrityFinding[] = [];

  for (const exception of state.exceptions) {
    if (!supportedCodes.has(exception.code as ExecutionIntegrityCode)) continue;

    const code = exception.code as ExecutionIntegrityCode;
    const source = sourceFor(code, state);
    if (!source) continue;

    const caseKey = bounded(
      encoded([
        EXECUTION_INTEGRITY_VERSION,
        state.businessId,
        state.opportunityId,
        code
      ]),
      EXECUTION_INTEGRITY_LIMITS.caseKey,
      "case_key"
    );

    const findingKey = bounded(
      encoded([
        caseKey,
        ...snapshotParts(code, state, source.sourceId)
      ]),
      EXECUTION_INTEGRITY_LIMITS.findingKey,
      "finding_key"
    );

    findings.push({
      version: EXECUTION_INTEGRITY_VERSION,
      businessId: state.businessId,
      opportunityId: state.opportunityId,
      caseKey,
      findingKey,
      code,
      severity: severityFor(exception),
      sourceType: source.sourceType,
      sourceId: bounded(source.sourceId, 256, "source_id"),
      label: bounded(
        exception.label,
        EXECUTION_INTEGRITY_LIMITS.label,
        "label"
      ),
      explanation: bounded(
        exception.explanation,
        EXECUTION_INTEGRITY_LIMITS.explanation,
        "explanation"
      ),
      safeActionLabel: bounded(
        exception.safeAction.label,
        EXECUTION_INTEGRITY_LIMITS.actionLabel,
        "safe_action_label"
      ),
      safeActionHref: bounded(
        exception.safeAction.href,
        EXECUTION_INTEGRITY_LIMITS.actionHref,
        "safe_action_href"
      ),
      evidenceRefs: evidenceFor(exception, state),
      evaluatedAt: state.evaluatedAt
    });

    if (findings.length >= EXECUTION_INTEGRITY_LIMITS.findingsPerOpportunity) {
      break;
    }
  }

  return findings.sort(
    (left, right) =>
      priority[right.code] - priority[left.code] ||
      left.caseKey.localeCompare(right.caseKey)
  );
}

export function executionIntegrityAgeDays(
  firstDetectedAt: string,
  now: Date
) {
  const detected = Date.parse(firstDetectedAt);
  if (!Number.isFinite(detected)) return 0;
  return Math.max(
    0,
    Math.floor((now.getTime() - detected) / 86_400_000)
  );
}
