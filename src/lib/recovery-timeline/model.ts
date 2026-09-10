import type { Opportunity } from "@/lib/types";
import type {
  RecoveryTimelineEvidence,
  RecoveryTimelineItem,
  RecoveryTimelineLifecycleStep,
  RecoveryTimelineModel,
  RecoveryTimelineStatus
} from "./types";

export const RECOVERY_TIMELINE_LIMITS = {
  windowDays: 30,
  maxItems: 24,
  defaultVisible: 6,
  maxEvidence: 3,
  maxLifecycleSteps: 6
} as const;

export type RecoveryExecutionFindingInput = {
  id: string;
  businessId: string;
  opportunityId: string;
  caseKey: string;
  findingKey: string;
  code: string;
  severity: "critical" | "attention";
  sourceType: string;
  sourceId: string;
  label: string;
  explanation: string;
  safeActionLabel: string;
  safeActionHref: string;
  evidenceRefs: RecoveryTimelineEvidence[];
  state: "open" | "resolved";
  firstDetectedAt: string;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
  resolvedAt: string | null;
};

export type RecoveryContextFindingInput = {
  id: string;
  businessId: string;
  opportunityId: string;
  caseKey: string;
  findingKey: string;
  kind: string;
  severity: "critical" | "high" | "medium" | "review";
  safeAction: string;
  evidenceRefs: RecoveryTimelineEvidence[];
  state:
    | "open"
    | "needs_review"
    | "resolved"
    | "dismissed"
    | "superseded";
  firstDetectedAt: string;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
  resolutionReason: string | null;
  resolutionNote: string | null;
  resolvedByProfileId: string | null;
  resolvedAt: string | null;
};

export type RecoveryAuditEventInput = {
  id: string;
  findingId: string;
  eventType: string;
  at: string;
  actorProfileId: string | null;
  actorLabel: string | null;
  note: string | null;
};

export type RecoveryOpportunityEventInput = {
  id: string;
  opportunityId: string;
  eventType: string;
  label: string;
  description: string | null;
  at: string;
  actorProfileId: string | null;
  actorLabel: string | null;
  metadata: Record<string, unknown>;
};

export type RecoverySignalEventInput = {
  id: string;
  signalId: string;
  eventType: string;
  description: string;
  at: string;
  actorProfileId: string | null;
  actorLabel: string | null;
};

const contextTitles: Record<string, string> = {
  source_association_mismatch: "Asociere de document",
  entity_context_mismatch: "Identitate în conflict",
  commercial_value_mismatch: "Valoare comercială în conflict",
  next_action_mismatch: "Următor pas în conflict",
  responsibility_mismatch: "Responsabilitate în conflict",
  execution_state_mismatch: "Stare de execuție în conflict"
};

const contextDescriptions: Record<string, string> = {
  source_association_mismatch:
    "O sursă asociată oportunității indică un alt context comercial și necesită revizuire.",
  entity_context_mismatch:
    "Identitatea observată în surse nu este coerentă cu entitatea canonică a oportunității.",
  commercial_value_mismatch:
    "Surse comparabile indică valori comerciale diferite pentru același context.",
  next_action_mismatch:
    "Sursele disponibile nu sunt coerente cu privire la următorul pas comercial.",
  responsibility_mismatch:
    "Responsabilitatea comercială diferă între sursele comparabile.",
  execution_state_mismatch:
    "Starea de execuție diferă între sursele comparabile."
};

const contextActions: Record<string, { label: string; anchor: string }> = {
  review_association: {
    label: "Revizuiește contextul",
    anchor: "context-integrity-review"
  },
  review_value: {
    label: "Revizuiește valoarea",
    anchor: "context-integrity-review"
  },
  review_next_action: {
    label: "Revizuiește următorul pas",
    anchor: "context-integrity-review"
  },
  review_responsibility: {
    label: "Revizuiește responsabilul",
    anchor: "context-integrity-review"
  },
  review_execution_state: {
    label: "Revizuiește execuția",
    anchor: "context-integrity-review"
  }
};

const contextResolution: Record<string, string> = {
  kept_current_context:
    "Contextul CRM a fost păstrat prin decizie umană.",
  source_belongs_elsewhere:
    "Sursa a fost confirmată ca aparținând altui context.",
  source_relinked:
    "Sursa a fost reasociată înainte de continuarea execuției.",
  current_value_confirmed:
    "Valoarea curentă a fost confirmată prin revizuire.",
  observation_marked_historical:
    "Observația a fost marcată ca istorică.",
  dismissed_with_reason:
    "Constatarea a fost închisă prin decizie umană motivată.",
  source_changed:
    "Sursa s-a schimbat, iar constatarea anterioară nu mai este activă."
};

const executionResolutionEventTypes: Record<string, string[]> = {
  overdue_next_action: [
    "next_action_completed",
    "action_completed",
    "action_postponed",
    "follow_up_scheduled",
    "opportunity_won",
    "opportunity_lost",
    "outcome_recorded"
  ],
  missing_next_action: [
    "next_action_created",
    "follow_up_scheduled",
    "commercial_response_recorded",
    "opportunity_won",
    "opportunity_lost",
    "outcome_recorded"
  ],
  unassigned_owner: [
    "commercial_details_changed",
    "opportunity_won",
    "opportunity_lost",
    "outcome_recorded"
  ],
  prepared_document_not_advanced: [
    "document_ready_to_send",
    "document_marked_sent",
    "document_generated",
    "document_edited",
    "opportunity_won",
    "opportunity_lost",
    "outcome_recorded"
  ]
};

function validTime(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function daysBetween(start: string, end: Date) {
  const parsed = validTime(start);
  if (parsed === null) return 0;
  return Math.max(
    0,
    Math.floor((end.getTime() - parsed) / 86_400_000)
  );
}

function minutesBetween(start: string, end: string | null) {
  const startMs = validTime(start);
  const endMs = validTime(end);
  if (startMs === null || endMs === null) return null;
  return Math.max(0, Math.round((endMs - startMs) / 60_000));
}

function statusFor(
  state: string,
  events: RecoveryAuditEventInput[]
): RecoveryTimelineStatus {
  if (
    state === "resolved" ||
    state === "dismissed" ||
    state === "superseded"
  ) {
    return "resolved";
  }

  const latestReopened = [...events]
    .filter((item) => item.eventType === "reopened")
    .sort((left, right) => right.at.localeCompare(left.at))[0];
  const latestDetected = [...events]
    .filter((item) => item.eventType === "detected")
    .sort((left, right) => right.at.localeCompare(left.at))[0];

  return latestReopened &&
    (!latestDetected || latestReopened.at >= latestDetected.at)
    ? "reopened"
    : "open";
}

function lifecycleLabel(
  domain: "execution" | "context_integrity",
  eventType: string
) {
  const execution: Record<string, string> = {
    detected: "Ruptură detectată",
    changed: "Starea sursei s-a schimbat",
    reopened: "Ruptura a reapărut",
    resolved: "Rezolvată prin schimbarea stării reale"
  };
  const context: Record<string, string> = {
    detected: "Neconcordanță detectată",
    observed: "Neconcordanța persistă",
    changed: "Dovezile s-au schimbat",
    reopened: "Cazul a reapărut",
    resolution_recorded: "Decizie umană consemnată",
    superseded: "Contextul anterior nu mai este activ"
  };
  return (
    (domain === "execution" ? execution : context)[eventType] ??
    "Stare actualizată"
  );
}

function lifecycleKind(
  eventType: string
): RecoveryTimelineLifecycleStep["kind"] {
  if (eventType === "detected") return "detected";
  if (eventType === "reopened") return "reopened";
  if (eventType === "resolution_recorded") return "decision";
  if (eventType === "resolved" || eventType === "superseded") {
    return "resolved";
  }
  return "changed";
}

function buildLifecycle(
  domain: "execution" | "context_integrity",
  events: RecoveryAuditEventInput[]
) {
  const ordered = [...events].sort((left, right) =>
    left.at.localeCompare(right.at)
  );
  const compressed: RecoveryAuditEventInput[] = [];

  for (const event of ordered) {
    const previous = compressed.at(-1);
    if (previous?.eventType === event.eventType) {
      compressed[compressed.length - 1] = event;
    } else {
      compressed.push(event);
    }
  }

  return compressed
    .map((event) => ({
      id: event.id,
      kind: lifecycleKind(event.eventType),
      label: lifecycleLabel(domain, event.eventType),
      at: event.at,
      actorLabel: event.actorLabel
    }))
    .slice(-RECOVERY_TIMELINE_LIMITS.maxLifecycleSteps);
}

function metadataString(
  metadata: Record<string, unknown>,
  key: string
) {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function eventMatchesExecutionSource(
  code: string,
  sourceId: string,
  event: RecoveryOpportunityEventInput
) {
  if (code === "overdue_next_action") {
    const actionId = metadataString(event.metadata, "action_id");
    return !actionId || actionId === sourceId;
  }

  if (code === "prepared_document_not_advanced") {
    const documentId =
      metadataString(event.metadata, "document_id") ??
      metadataString(event.metadata, "source_document_id");
    return !documentId || documentId === sourceId;
  }

  return true;
}

function nearestResolutionEvent(input: {
  finding: RecoveryExecutionFindingInput;
  opportunityEvents: RecoveryOpportunityEventInput[];
  signalEvents: RecoverySignalEventInput[];
}) {
  const resolvedMs = validTime(input.finding.resolvedAt);
  if (resolvedMs === null) return null;

  if (input.finding.code === "pending_approval") {
    const candidates = input.signalEvents
      .filter((event) => event.signalId === input.finding.sourceId)
      .map((event) => ({
        id: event.id,
        label: event.description || "Decizie de aprobare înregistrată",
        at: event.at,
        actorLabel: event.actorLabel,
        distance:
          Math.abs((validTime(event.at) ?? resolvedMs) - resolvedMs)
      }))
      .filter((event) => event.distance <= 10 * 60_000)
      .sort(
        (left, right) =>
          left.distance - right.distance ||
          right.at.localeCompare(left.at)
      );

    return candidates[0] ?? null;
  }

  const allowed =
    executionResolutionEventTypes[input.finding.code] ?? [];

  const candidates = input.opportunityEvents
    .filter(
      (event) =>
        event.opportunityId === input.finding.opportunityId &&
        allowed.includes(event.eventType) &&
        eventMatchesExecutionSource(
          input.finding.code,
          input.finding.sourceId,
          event
        )
    )
    .map((event) => ({
      id: event.id,
      label: event.label,
      at: event.at,
      actorLabel: event.actorLabel,
      distance:
        Math.abs((validTime(event.at) ?? resolvedMs) - resolvedMs)
    }))
    .filter((event) => event.distance <= 10 * 60_000)
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        right.at.localeCompare(left.at)
    );

  return candidates[0] ?? null;
}

function executionResolutionSummary(
  finding: RecoveryExecutionFindingInput,
  matchedEvent: { label: string } | null
) {
  if (!finding.resolvedAt) return null;

  if (matchedEvent?.label) {
    return matchedEvent.label;
  }

  const fallback: Record<string, string> = {
    overdue_next_action:
      "Acțiunea nu mai este restantă în starea comercială curentă.",
    missing_next_action:
      "Oportunitatea are din nou un următor pas verificabil.",
    unassigned_owner:
      "Oportunitatea are din nou un responsabil atribuit.",
    pending_approval:
      "Aprobarea nu mai blochează execuția în starea curentă.",
    prepared_document_not_advanced:
      "Documentul a avansat din starea care genera blocajul."
  };

  return (
    fallback[finding.code] ??
    "Starea sursei nu mai îndeplinește regula care a generat cazul."
  );
}

function opportunityMap(opportunities: Opportunity[]) {
  return new Map(opportunities.map((item) => [item.id, item]));
}

function organizationName(opportunity: Opportunity) {
  const primaryContact = opportunity.contacts?.find(
    (association) => association.isPrimary
  );
  return (
    primaryContact?.contact.organization?.name ??
    opportunity.contact?.company ??
    opportunity.title.split("·")[1]?.trim() ??
    "Companie neconfirmată"
  );
}

function estimatedValue(opportunity: Opportunity) {
  const high = Number(opportunity.estimatedValueHigh ?? 0);
  const low = Number(opportunity.estimatedValueLow ?? 0);
  if (Number.isFinite(high) && high > 0) return high;
  if (Number.isFinite(low) && low > 0) return low;
  return null;
}

function executionItem(input: {
  finding: RecoveryExecutionFindingInput;
  events: RecoveryAuditEventInput[];
  opportunity: Opportunity;
  opportunityEvents: RecoveryOpportunityEventInput[];
  signalEvents: RecoverySignalEventInput[];
  now: Date;
}): RecoveryTimelineItem {
  const matchedResolution = nearestResolutionEvent({
    finding: input.finding,
    opportunityEvents: input.opportunityEvents,
    signalEvents: input.signalEvents
  });
  const status = statusFor(input.finding.state, input.events);
  const resolutionEvidence: RecoveryTimelineEvidence[] =
    input.finding.resolvedAt && matchedResolution
      ? [
          {
            id: `resolution:${matchedResolution.id}`,
            kind: "resolution",
            sourceType: "audit_event",
            label: matchedResolution.label,
            observedAt: matchedResolution.at,
            href: `/opportunities/${encodeURIComponent(
              input.finding.opportunityId
            )}#opportunity-timeline`,
            actorLabel: matchedResolution.actorLabel
          }
        ]
      : [];

  return {
    id: `execution:${input.finding.id}`,
    domain: "execution",
    caseKey: input.finding.caseKey,
    findingKey: input.finding.findingKey,
    status,
    severity:
      input.finding.severity === "critical"
        ? "critical"
        : "attention",
    code: input.finding.code,
    title: input.finding.label,
    description: input.finding.explanation,
    opportunityId: input.finding.opportunityId,
    opportunityTitle: input.opportunity.title,
    organizationName: organizationName(input.opportunity),
    ownerName:
      input.opportunity.ownerName ??
      (input.opportunity.ownerProfileId
        ? "Responsabil atribuit"
        : "Fără responsabil"),
    estimatedValue: estimatedValue(input.opportunity),
    currency: input.opportunity.currency ?? "RON",
    firstDetectedAt: input.finding.firstDetectedAt,
    lastDetectedAt: input.finding.lastDetectedAt,
    lastEvaluatedAt: input.finding.lastEvaluatedAt,
    resolvedAt: input.finding.resolvedAt,
    ageDays: daysBetween(input.finding.firstDetectedAt, input.now),
    durationMinutes: minutesBetween(
      input.finding.firstDetectedAt,
      input.finding.resolvedAt
    ),
    resolutionSummary: executionResolutionSummary(
      input.finding,
      matchedResolution
    ),
    resolutionNote: null,
    resolutionActorLabel: matchedResolution?.actorLabel ?? null,
    safeActionLabel: input.finding.safeActionLabel,
    safeActionHref: input.finding.safeActionHref,
    evidence: [
      ...resolutionEvidence,
      ...input.finding.evidenceRefs
    ].slice(0, RECOVERY_TIMELINE_LIMITS.maxEvidence),
    lifecycle: buildLifecycle("execution", input.events)
  };
}

function contextItem(input: {
  finding: RecoveryContextFindingInput;
  events: RecoveryAuditEventInput[];
  opportunity: Opportunity;
  now: Date;
}): RecoveryTimelineItem {
  const status = statusFor(input.finding.state, input.events);
  const action =
    contextActions[input.finding.safeAction] ??
    contextActions.review_association;
  const resolutionActor =
    input.events
      .filter((event) => event.eventType === "resolution_recorded")
      .sort((left, right) => right.at.localeCompare(left.at))[0]
      ?.actorLabel ?? null;
  const closeEvent =
    input.events
      .filter((event) =>
        ["resolution_recorded", "superseded"].includes(event.eventType)
      )
      .sort((left, right) => right.at.localeCompare(left.at))[0] ?? null;
  const resolvedAt =
    input.finding.resolvedAt ??
    (input.finding.state === "superseded" ? closeEvent?.at ?? null : null);

  return {
    id: `context:${input.finding.id}`,
    domain: "context_integrity",
    caseKey: input.finding.caseKey,
    findingKey: input.finding.findingKey,
    status,
    severity:
      input.finding.severity === "medium"
        ? "attention"
        : input.finding.severity,
    code: input.finding.kind,
    title:
      contextTitles[input.finding.kind] ??
      "Integritatea contextului necesită revizuire",
    description:
      contextDescriptions[input.finding.kind] ??
      "Contextul comercial necesită o verificare înainte de execuție.",
    opportunityId: input.finding.opportunityId,
    opportunityTitle: input.opportunity.title,
    organizationName: organizationName(input.opportunity),
    ownerName:
      input.opportunity.ownerName ??
      (input.opportunity.ownerProfileId
        ? "Responsabil atribuit"
        : "Fără responsabil"),
    estimatedValue: estimatedValue(input.opportunity),
    currency: input.opportunity.currency ?? "RON",
    firstDetectedAt: input.finding.firstDetectedAt,
    lastDetectedAt: input.finding.lastDetectedAt,
    lastEvaluatedAt: input.finding.lastEvaluatedAt,
    resolvedAt,
    ageDays: daysBetween(input.finding.firstDetectedAt, input.now),
    durationMinutes: minutesBetween(
      input.finding.firstDetectedAt,
      resolvedAt
    ),
    resolutionSummary: input.finding.resolutionReason
      ? contextResolution[input.finding.resolutionReason] ??
        "Decizia asupra contextului a fost consemnată."
      : input.finding.state === "superseded"
        ? "Contextul anterior nu mai este activ după reevaluarea surselor."
        : null,
    resolutionNote: input.finding.resolutionNote,
    resolutionActorLabel: resolutionActor,
    safeActionLabel: action.label,
    safeActionHref: `/opportunities/${encodeURIComponent(
      input.finding.opportunityId
    )}?tab=context#${action.anchor}`,
    evidence: input.finding.evidenceRefs.slice(
      0,
      RECOVERY_TIMELINE_LIMITS.maxEvidence
    ),
    lifecycle: buildLifecycle("context_integrity", input.events)
  };
}

function recentOrActive(
  item: RecoveryTimelineItem,
  now: Date,
  windowDays: number
) {
  if (item.status !== "resolved") return true;
  const resolved = validTime(item.resolvedAt);
  if (resolved === null) return false;
  return now.getTime() - resolved <= windowDays * 86_400_000;
}

function activityAt(item: RecoveryTimelineItem) {
  return (
    item.resolvedAt ??
    item.lastDetectedAt ??
    item.lastEvaluatedAt ??
    item.firstDetectedAt
  );
}

function severityRank(item: RecoveryTimelineItem) {
  const map: Record<RecoveryTimelineItem["severity"], number> = {
    critical: 4,
    high: 3,
    attention: 2,
    review: 1
  };
  return map[item.severity];
}

function sortItems(items: RecoveryTimelineItem[]) {
  const active = items
    .filter((item) => item.status !== "resolved")
    .sort(
      (left, right) =>
        severityRank(right) - severityRank(left) ||
        right.ageDays - left.ageDays ||
        activityAt(right).localeCompare(activityAt(left))
    );

  const resolved = items
    .filter((item) => item.status === "resolved")
    .sort((left, right) =>
      activityAt(right).localeCompare(activityAt(left))
    );

  return [...active, ...resolved];
}

function valueAssociated(items: RecoveryTimelineItem[]) {
  const byOpportunity = new Map<
    string,
    { currency: string; amount: number }
  >();

  for (const item of items) {
    if (
      item.estimatedValue === null ||
      !Number.isFinite(item.estimatedValue) ||
      item.estimatedValue <= 0
    ) {
      continue;
    }

    if (!byOpportunity.has(item.opportunityId)) {
      byOpportunity.set(item.opportunityId, {
        currency: item.currency,
        amount: item.estimatedValue
      });
    }
  }

  const totals = new Map<string, number>();
  for (const value of Array.from(byOpportunity.values())) {
    totals.set(
      value.currency,
      (totals.get(value.currency) ?? 0) + value.amount
    );
  }

  return Array.from(totals.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function buildRecoveryTimelineModel(input: {
  opportunities: Opportunity[];
  executionFindings: RecoveryExecutionFindingInput[];
  contextFindings: RecoveryContextFindingInput[];
  executionEvents: RecoveryAuditEventInput[];
  contextEvents: RecoveryAuditEventInput[];
  opportunityEvents: RecoveryOpportunityEventInput[];
  signalEvents: RecoverySignalEventInput[];
  now?: Date;
  windowDays?: number;
  coverage?: "complete" | "partial";
}): RecoveryTimelineModel {
  const now = input.now ?? new Date();
  const windowDays =
    input.windowDays ?? RECOVERY_TIMELINE_LIMITS.windowDays;
  const opportunities = opportunityMap(input.opportunities);

  const executionEventsByFinding = new Map<
    string,
    RecoveryAuditEventInput[]
  >();
  const contextEventsByFinding = new Map<
    string,
    RecoveryAuditEventInput[]
  >();

  for (const event of input.executionEvents) {
    const events =
      executionEventsByFinding.get(event.findingId) ?? [];
    events.push(event);
    executionEventsByFinding.set(event.findingId, events);
  }

  for (const event of input.contextEvents) {
    const events =
      contextEventsByFinding.get(event.findingId) ?? [];
    events.push(event);
    contextEventsByFinding.set(event.findingId, events);
  }

  const items: RecoveryTimelineItem[] = [];

  for (const finding of input.executionFindings) {
    const opportunity = opportunities.get(finding.opportunityId);
    if (!opportunity) continue;
    items.push(
      executionItem({
        finding,
        events:
          executionEventsByFinding.get(finding.id) ?? [],
        opportunity,
        opportunityEvents: input.opportunityEvents,
        signalEvents: input.signalEvents,
        now
      })
    );
  }

  for (const finding of input.contextFindings) {
    if (finding.kind === "insufficient_context_integrity") {
      continue;
    }

    const opportunity = opportunities.get(finding.opportunityId);
    if (!opportunity) continue;

    items.push(
      contextItem({
        finding,
        events: contextEventsByFinding.get(finding.id) ?? [],
        opportunity,
        now
      })
    );
  }

  const visible = sortItems(
    items.filter((item) => recentOrActive(item, now, windowDays))
  ).slice(0, RECOVERY_TIMELINE_LIMITS.maxItems);

  const resolved = visible.filter(
    (item) =>
      item.status === "resolved" &&
      item.durationMinutes !== null
  );
  const averageResolutionMinutes = resolved.length
    ? Math.round(
        resolved.reduce(
          (sum, item) => sum + (item.durationMinutes ?? 0),
          0
        ) / resolved.length
      )
    : null;

  return {
    windowDays,
    generatedAt: now.toISOString(),
    openCount: visible.filter(
      (item) => item.status !== "resolved"
    ).length,
    reopenedCount: visible.filter(
      (item) => item.status === "reopened"
    ).length,
    resolvedCount: visible.filter(
      (item) => item.status === "resolved"
    ).length,
    averageResolutionMinutes,
    valueAssociated: valueAssociated(visible),
    items: visible,
    coverage: input.coverage ?? "complete"
  };
}
