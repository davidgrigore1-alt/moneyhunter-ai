export type PilotRecoveryDomain = "execution" | "context_integrity";

export type PilotRecoveryAuditEvent = {
  id: string;
  domain: PilotRecoveryDomain;
  findingId: string;
  caseKey: string;
  opportunityId: string;
  eventType: string;
  at: string;
};

export type PilotRecoverySnapshotOpportunity = {
  opportunityId: string;
  estimatedValue: number | null;
  currency: string;
};

export type PilotRecoveryValue = {
  currency: string;
  value: number;
};

export type PilotRecoveryFacts = {
  startAt: string;
  endAt: string;
  trackedCaseCount: number;
  verifiedClosureCount: number;
  sourceResolvedExecutionCount: number;
  sourceResolvedContextCount: number;
  humanContextDecisionCount: number;
  reopenedCount: number;
  averageResolutionMinutes: number | null;
  associatedValueByCurrency: PilotRecoveryValue[];
  touchedOpportunityIds: string[];
  closedCaseKeys: string[];
  partial: boolean;
};

function isClosureEvent(event: PilotRecoveryAuditEvent) {
  return event.domain === "execution"
    ? event.eventType === "resolved"
    : ["resolution_recorded", "superseded"].includes(
        event.eventType
      );
}

function time(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inWindow(at: string, startMs: number, endMs: number) {
  const parsed = time(at);
  return parsed !== null && parsed >= startMs && parsed <= endMs;
}

function eventKey(event: PilotRecoveryAuditEvent) {
  return `${event.domain}:${event.caseKey}`;
}

function uniqueCount(events: PilotRecoveryAuditEvent[]) {
  return new Set(events.map(eventKey)).size;
}

function resolutionCycleMinutes(
  closure: PilotRecoveryAuditEvent,
  allEvents: PilotRecoveryAuditEvent[]
) {
  const closureMs = time(closure.at);
  if (closureMs === null) return null;

  const starts = allEvents
    .filter(
      (event) =>
        event.domain === closure.domain &&
        event.caseKey === closure.caseKey &&
        ["detected", "reopened"].includes(event.eventType)
    )
    .filter((event) => {
      const eventMs = time(event.at);
      return eventMs !== null && eventMs <= closureMs;
    })
    .sort((left, right) => right.at.localeCompare(left.at));

  const startMs = starts[0] ? time(starts[0].at) : null;
  if (startMs === null) return null;

  return Math.max(0, Math.round((closureMs - startMs) / 60_000));
}

function associatedValue(
  touchedOpportunityIds: Set<string>,
  opportunities: PilotRecoverySnapshotOpportunity[]
) {
  const byOpportunity = new Map(
    opportunities.map((item) => [item.opportunityId, item])
  );
  const totals = new Map<string, number>();

  for (const opportunityId of Array.from(touchedOpportunityIds)) {
    const opportunity = byOpportunity.get(opportunityId);
    if (
      !opportunity ||
      opportunity.estimatedValue === null ||
      !Number.isFinite(opportunity.estimatedValue) ||
      opportunity.estimatedValue <= 0
    ) {
      continue;
    }

    totals.set(
      opportunity.currency,
      (totals.get(opportunity.currency) ?? 0) +
        opportunity.estimatedValue
    );
  }

  return Array.from(totals.entries())
    .map(([currency, value]) => ({ currency, value }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function buildPilotRecoveryFacts(input: {
  startAt: string;
  endAt: string;
  events: PilotRecoveryAuditEvent[];
  snapshotOpportunities: PilotRecoverySnapshotOpportunity[];
  partial?: boolean;
}): PilotRecoveryFacts {
  const startMs = time(input.startAt);
  const endMs = time(input.endAt);

  if (
    startMs === null ||
    endMs === null ||
    endMs < startMs
  ) {
    throw new Error("pilot_recovery_invalid_window");
  }

  const ordered = [...input.events]
    .filter((event) => time(event.at) !== null)
    .sort(
      (left, right) =>
        left.at.localeCompare(right.at) ||
        left.id.localeCompare(right.id)
    );

  const windowEvents = ordered.filter((event) =>
    inWindow(event.at, startMs, endMs)
  );

  const closureEvents = windowEvents.filter(isClosureEvent);

  const latestClosureByCase = new Map<string, PilotRecoveryAuditEvent>();
  for (const event of closureEvents) {
    latestClosureByCase.set(eventKey(event), event);
  }

  const sourceResolvedExecution = closureEvents.filter(
    (event) =>
      event.domain === "execution" &&
      event.eventType === "resolved"
  );
  const sourceResolvedContext = closureEvents.filter(
    (event) =>
      event.domain === "context_integrity" &&
      event.eventType === "superseded"
  );
  const humanContextDecisions = closureEvents.filter(
    (event) =>
      event.domain === "context_integrity" &&
      event.eventType === "resolution_recorded"
  );
  const reopened = windowEvents.filter(
    (event) => event.eventType === "reopened"
  );

  const touchedOpportunityIds = new Set(
    windowEvents.map((event) => event.opportunityId)
  );

  const durations = Array.from(latestClosureByCase.values())
    .map((event) => resolutionCycleMinutes(event, ordered))
    .filter((value): value is number => value !== null);

  const averageResolutionMinutes = durations.length
    ? Math.round(
        durations.reduce((sum, value) => sum + value, 0) /
          durations.length
      )
    : null;

  return {
    startAt: input.startAt,
    endAt: input.endAt,
    trackedCaseCount: uniqueCount(windowEvents),
    verifiedClosureCount: latestClosureByCase.size,
    sourceResolvedExecutionCount: uniqueCount(
      sourceResolvedExecution
    ),
    sourceResolvedContextCount: uniqueCount(
      sourceResolvedContext
    ),
    humanContextDecisionCount: uniqueCount(
      humanContextDecisions
    ),
    reopenedCount: uniqueCount(reopened),
    averageResolutionMinutes,
    associatedValueByCurrency: associatedValue(
      touchedOpportunityIds,
      input.snapshotOpportunities
    ),
    touchedOpportunityIds: Array.from(touchedOpportunityIds).sort(),
    closedCaseKeys: Array.from(
      new Set(
        Array.from(latestClosureByCase.values()).map(
          (event) => event.caseKey
        )
      )
    ).sort(),
    partial: Boolean(input.partial)
  };
}
