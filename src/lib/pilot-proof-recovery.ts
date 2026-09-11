import "server-only";

import { getCurrentBusinessForUser } from "@/lib/business/current-business";
import type {
  PilotEngagement
} from "@/lib/pilot-measurement";
import type {
  PilotSnapshotPayload
} from "@/lib/pilot-measurement-core";
import {
  buildPilotRecoveryFacts,
  type PilotRecoveryAuditEvent,
  type PilotRecoveryFacts
} from "@/lib/pilot-proof-recovery-core";
import { getRecoverySummary } from "@/lib/recovery";
import { getRecoveryTimeline } from "@/lib/recovery-timeline/server";
import type {
  RecoveryTimelineItem
} from "@/lib/recovery-timeline/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EVENT_LIMIT = 600;

type ExecutionEventRow = {
  id: string;
  finding_id: string;
  opportunity_id: string;
  event_type: string;
  case_key: string;
  created_at: string;
};

type ContextEventRow = {
  id: string;
  finding_id: string;
  opportunity_id: string | null;
  event_type: string;
  case_key: string;
  created_at: string;
};

export type PilotRecoveryProof = PilotRecoveryFacts & {
  examples: RecoveryTimelineItem[];
  coverage: "complete" | "partial";
};

function within(
  value: string | null,
  startAt: string,
  endAt: string
) {
  if (!value) return false;
  const at = Date.parse(value);
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  return (
    Number.isFinite(at) &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    at >= start &&
    at <= end
  );
}

export async function getPilotRecoveryProof(input: {
  pilot: PilotEngagement;
  snapshot: PilotSnapshotPayload;
  startAt: string;
  endAt: string;
}): Promise<PilotRecoveryProof | null> {
  const current = await getCurrentBusinessForUser({
    redirectIfMissing: true
  });
  if (!current) return null;

  if (
    input.pilot.businessId !== current.business.id ||
    input.snapshot.businessId !== current.business.id
  ) {
    throw new Error("pilot_recovery_scope_forbidden");
  }

  if (
    input.snapshot.pilotId !== input.pilot.id ||
    JSON.stringify(input.snapshot.cohortOpportunityIds) !==
      JSON.stringify(input.pilot.cohortOpportunityIds)
  ) {
    throw new Error("pilot_recovery_snapshot_scope_mismatch");
  }

  const startMs = Date.parse(input.startAt);
  const endMs = Date.parse(input.endAt);
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs < startMs
  ) {
    throw new Error("pilot_recovery_invalid_window");
  }

  const cohortIds = input.pilot.cohortOpportunityIds.slice(0, 200);
  if (!cohortIds.length) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [executionResult, contextResult] = await Promise.all([
    supabase
      .from("execution_integrity_finding_events")
      .select(
        "id,finding_id,opportunity_id,event_type,case_key,created_at"
      )
      .eq("business_id", current.business.id)
      .in("opportunity_id", cohortIds)
      .lte("created_at", input.endAt)
      .order("created_at", { ascending: false })
      .limit(EVENT_LIMIT + 1),
    supabase
      .from("context_integrity_finding_events")
      .select(
        "id,finding_id,opportunity_id,event_type,case_key,created_at"
      )
      .eq("business_id", current.business.id)
      .in("opportunity_id", cohortIds)
      .lte("created_at", input.endAt)
      .order("created_at", { ascending: false })
      .limit(EVENT_LIMIT + 1)
  ]);

  const executionRows = executionResult.error
    ? []
    : ((executionResult.data ?? []) as ExecutionEventRow[]);
  const contextRows = contextResult.error
    ? []
    : ((contextResult.data ?? []) as ContextEventRow[]);

  const truncated =
    executionRows.length > EVENT_LIMIT ||
    contextRows.length > EVENT_LIMIT;

  const events: PilotRecoveryAuditEvent[] = [
    ...executionRows.slice(0, EVENT_LIMIT).flatMap((row) =>
      row.opportunity_id
        ? [
            {
              id: row.id,
              domain: "execution" as const,
              findingId: row.finding_id,
              caseKey: row.case_key,
              opportunityId: row.opportunity_id,
              eventType: row.event_type,
              at: row.created_at
            }
          ]
        : []
    ),
    ...contextRows.slice(0, EVENT_LIMIT).flatMap((row) =>
      row.opportunity_id
        ? [
            {
              id: row.id,
              domain: "context_integrity" as const,
              findingId: row.finding_id,
              caseKey: row.case_key,
              opportunityId: row.opportunity_id,
              eventType: row.event_type,
              at: row.created_at
            }
          ]
        : []
    )
  ];

  const queryPartial =
    Boolean(executionResult.error) ||
    Boolean(contextResult.error) ||
    truncated;

  const facts = buildPilotRecoveryFacts({
    startAt: input.startAt,
    endAt: input.endAt,
    events,
    snapshotOpportunities: input.snapshot.opportunities.map(
      (opportunity) => ({
        opportunityId: opportunity.opportunityId,
        estimatedValue: opportunity.estimatedValue,
        currency: opportunity.currency
      })
    ),
    partial: queryPartial
  });

  let examples: RecoveryTimelineItem[] = [];
  let timelinePartial = false;

  try {
    const summary = await getRecoverySummary();
    const cohortSet = new Set(cohortIds);
    const cohort = summary.opportunities.filter((opportunity) =>
      cohortSet.has(opportunity.id)
    );

    if (cohort.length !== cohortIds.length) {
      timelinePartial = true;
    }

    const timeline = await getRecoveryTimeline(
      cohort,
      new Date(input.endAt)
    );

    if (!timeline) {
      timelinePartial = true;
    } else {
      const closed = new Set(facts.closedCaseKeys);
      examples = timeline.items
        .filter(
          (item) =>
            closed.has(item.caseKey) &&
            item.status === "resolved" &&
            within(item.resolvedAt, input.startAt, input.endAt)
        )
        .sort((left, right) =>
          (right.resolvedAt ?? "").localeCompare(
            left.resolvedAt ?? ""
          )
        )
        .slice(0, 4);

      if (timeline.coverage === "partial") {
        timelinePartial = true;
      }
    }
  } catch {
    timelinePartial = true;
  }

  const partial = queryPartial || timelinePartial;

  return {
    ...facts,
    partial,
    examples,
    coverage: partial ? "partial" : "complete"
  };
}
