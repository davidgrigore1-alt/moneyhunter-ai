import "server-only";

import { requirePermission } from "@/lib/authz/require-permission";
import { getCurrentBusinessForUser } from "@/lib/business/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/lib/types";
import {
  buildRecoveryTimelineModel,
  RECOVERY_TIMELINE_LIMITS,
  type RecoveryAuditEventInput,
  type RecoveryContextFindingInput,
  type RecoveryExecutionFindingInput,
  type RecoveryOpportunityEventInput,
  type RecoverySignalEventInput
} from "./model";
import type {
  RecoveryTimelineEvidence,
  RecoveryTimelineModel
} from "./types";

type JsonObject = Record<string, unknown>;

type ExecutionFindingRow = {
  id: string;
  business_id: string;
  opportunity_id: string;
  case_key: string;
  finding_key: string;
  code: string;
  severity: "critical" | "attention";
  source_type: string;
  source_id: string;
  label: string;
  explanation: string;
  safe_action_label: string;
  safe_action_href: string;
  evidence_refs: unknown;
  state: "open" | "resolved";
  first_detected_at: string;
  last_detected_at: string;
  last_evaluated_at: string;
  resolved_at: string | null;
};

type ContextFindingRow = {
  id: string;
  business_id: string;
  opportunity_id: string | null;
  case_key: string;
  finding_key: string;
  kind: string;
  severity: "critical" | "high" | "medium" | "review";
  safe_action: string;
  evidence_refs: unknown;
  state:
    | "open"
    | "needs_review"
    | "resolved"
    | "dismissed"
    | "superseded";
  first_detected_at: string;
  last_detected_at: string;
  last_evaluated_at: string;
  resolution_reason: string | null;
  resolution_note: string | null;
  resolved_by_profile_id: string | null;
  resolved_at: string | null;
};

type AuditEventRow = {
  id: string;
  finding_id: string;
  event_type: string;
  actor_profile_id?: string | null;
  note?: string | null;
  created_at: string;
};

type OpportunityEventRow = {
  id: string;
  opportunity_id: string;
  event_type: string;
  label: string;
  description: string | null;
  actor_profile_id: string | null;
  metadata: unknown;
  occurred_at: string;
};

type SignalEventRow = {
  id: string;
  signal_id: string;
  event_type: string;
  description: string | null;
  created_by_profile_id: string | null;
  created_at: string;
};

function object(value: unknown): JsonObject {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function text(
  value: unknown,
  fallback = "",
  max = 240
): string {
  if (typeof value !== "string") return fallback;
  const result = value.trim();
  return result ? result.slice(0, max) : fallback;
}

function iso(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !Number.isFinite(Date.parse(value))
  ) {
    return null;
  }
  return value;
}

function evidenceHref(
  opportunityId: string,
  sourceType: string,
  rawHref?: unknown
) {
  const explicit = text(rawHref, "", 600);
  if (explicit.startsWith("/")) return explicit;

  if (
    sourceType === "document" ||
    sourceType === "drive_document" ||
    sourceType === "google_drive"
  ) {
    return `/opportunities/${encodeURIComponent(
      opportunityId
    )}?tab=context#context-integrity-review`;
  }

  return `/opportunities/${encodeURIComponent(opportunityId)}`;
}

function executionEvidence(
  opportunityId: string,
  raw: unknown
): RecoveryTimelineEvidence[] {
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 6).flatMap((value, index) => {
    const row = object(value);
    const sourceType = text(row.sourceType, "source", 64);
    const sourceId = text(row.sourceId, "", 256);
    const label = text(row.label, "", 240);
    if (!sourceId || !label) return [];

    return [
      {
        id: `execution-evidence:${sourceType}:${sourceId}:${index}`,
        kind: "source" as const,
        sourceType,
        label,
        observedAt: iso(row.observedAt),
        href: evidenceHref(
          opportunityId,
          sourceType,
          row.href
        ),
        actorLabel: null
      }
    ];
  });
}

function contextEvidence(
  opportunityId: string,
  raw: unknown
): RecoveryTimelineEvidence[] {
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 6).flatMap((value, index) => {
    const row = object(value);
    const sourceType = text(row.sourceType, "source", 64);
    const sourceId = text(row.sourceId, "", 256);
    if (!sourceId) return [];

    const provider = text(row.provider, "", 64);
    const title = text(row.title, "", 240);
    const sourceLocation = text(row.sourceLocation, "", 240);
    const label =
      title ||
      sourceLocation ||
      (provider
        ? `${provider} · dovadă`
        : `${sourceType} · dovadă`);

    return [
      {
        id: `context-evidence:${sourceType}:${sourceId}:${index}`,
        kind: "source" as const,
        sourceType,
        label,
        observedAt: iso(row.occurredAt),
        href: evidenceHref(
          opportunityId,
          sourceType
        ),
        actorLabel: null
      }
    ];
  });
}

function profileIds(input: {
  contextRows: ContextFindingRow[];
  executionEvents: AuditEventRow[];
  contextEvents: AuditEventRow[];
  opportunityEvents: OpportunityEventRow[];
  signalEvents: SignalEventRow[];
}) {
  return Array.from(
    new Set(
      [
        ...input.contextRows.map(
          (row) => row.resolved_by_profile_id
        ),
        ...input.executionEvents.map(
          (row) => row.actor_profile_id ?? null
        ),
        ...input.contextEvents.map(
          (row) => row.actor_profile_id ?? null
        ),
        ...input.opportunityEvents.map(
          (row) => row.actor_profile_id
        ),
        ...input.signalEvents.map(
          (row) => row.created_by_profile_id
        )
      ].filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      )
    )
  );
}

export async function getRecoveryTimeline(
  opportunities: Opportunity[],
  now = new Date()
): Promise<RecoveryTimelineModel | null> {
  await requirePermission("opportunities.read");

  const current = await getCurrentBusinessForUser({
    redirectIfMissing: true
  });
  if (!current) return null;

  if (
    opportunities.some(
      (item) =>
        item.businessId &&
        item.businessId !== current.business.id
    )
  ) {
    throw new Error("recovery_timeline_scope_forbidden");
  }

  const scoped = opportunities.slice(0, 100);
  const opportunityIds = scoped.map((item) => item.id);
  if (!opportunityIds.length) {
    return buildRecoveryTimelineModel({
      opportunities: [],
      executionFindings: [],
      contextFindings: [],
      executionEvents: [],
      contextEvents: [],
      opportunityEvents: [],
      signalEvents: [],
      now
    });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [
    executionResult,
    contextResult,
    opportunityEventsResult
  ] = await Promise.all([
    supabase
      .from("execution_integrity_findings")
      .select(
        "id,business_id,opportunity_id,case_key,finding_key,code,severity,source_type,source_id,label,explanation,safe_action_label,safe_action_href,evidence_refs,state,first_detected_at,last_detected_at,last_evaluated_at,resolved_at"
      )
      .eq("business_id", current.business.id)
      .in("opportunity_id", opportunityIds)
      .order("last_evaluated_at", { ascending: false })
      .limit(160),
    supabase
      .from("context_integrity_findings")
      .select(
        "id,business_id,opportunity_id,case_key,finding_key,kind,severity,safe_action,evidence_refs,state,first_detected_at,last_detected_at,last_evaluated_at,resolution_reason,resolution_note,resolved_by_profile_id,resolved_at"
      )
      .eq("business_id", current.business.id)
      .in("opportunity_id", opportunityIds)
      .order("last_evaluated_at", { ascending: false })
      .limit(160),
    supabase
      .from("opportunity_events")
      .select(
        "id,opportunity_id,event_type,label,description,actor_profile_id,metadata,occurred_at"
      )
      .eq("business_id", current.business.id)
      .in("opportunity_id", opportunityIds)
      .order("occurred_at", { ascending: false })
      .limit(320)
  ]);

  const executionRows = executionResult.error
    ? []
    : ((executionResult.data ?? []) as ExecutionFindingRow[]);
  const contextRows = contextResult.error
    ? []
    : ((contextResult.data ?? []) as ContextFindingRow[]);
  const opportunityEventRows = opportunityEventsResult.error
    ? []
    : ((opportunityEventsResult.data ?? []) as OpportunityEventRow[]);

  const coverage: "complete" | "partial" =
    executionResult.error ||
    contextResult.error ||
    opportunityEventsResult.error
      ? "partial"
      : "complete";

  if (
    coverage === "partial" &&
    !executionRows.length &&
    !contextRows.length
  ) {
    return null;
  }

  const executionFindingIds = executionRows.map((row) => row.id);
  const contextFindingIds = contextRows.map((row) => row.id);
  const approvalSignalIds = Array.from(
    new Set(
      executionRows
        .filter((row) => row.code === "pending_approval")
        .map((row) => row.source_id)
    )
  );

  const [
    executionEventsResult,
    contextEventsResult,
    signalEventsResult
  ] = await Promise.all([
    executionFindingIds.length
      ? supabase
          .from("execution_integrity_finding_events")
          .select("id,finding_id,event_type,created_at")
          .eq("business_id", current.business.id)
          .in("finding_id", executionFindingIds)
          .order("created_at", { ascending: true })
          .limit(400)
      : Promise.resolve({ data: [], error: null }),
    contextFindingIds.length
      ? supabase
          .from("context_integrity_finding_events")
          .select(
            "id,finding_id,event_type,actor_profile_id,note,created_at"
          )
          .eq("business_id", current.business.id)
          .in("finding_id", contextFindingIds)
          .order("created_at", { ascending: true })
          .limit(400)
      : Promise.resolve({ data: [], error: null }),
    approvalSignalIds.length
      ? supabase
          .from("commercial_signal_events")
          .select(
            "id,signal_id,event_type,description,created_by_profile_id,created_at"
          )
          .eq("business_id", current.business.id)
          .in("signal_id", approvalSignalIds)
          .order("created_at", { ascending: false })
          .limit(160)
      : Promise.resolve({ data: [], error: null })
  ]);

  const executionEventRows = executionEventsResult.error
    ? []
    : ((executionEventsResult.data ?? []) as AuditEventRow[]);
  const contextEventRows = contextEventsResult.error
    ? []
    : ((contextEventsResult.data ?? []) as AuditEventRow[]);
  const signalEventRows = signalEventsResult.error
    ? []
    : ((signalEventsResult.data ?? []) as SignalEventRow[]);

  const ids = profileIds({
    contextRows,
    executionEvents: executionEventRows,
    contextEvents: contextEventRows,
    opportunityEvents: opportunityEventRows,
    signalEvents: signalEventRows
  });

  const profilesResult = ids.length
    ? await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", ids)
        .limit(100)
    : { data: [], error: null };

  const names = new Map<string, string>();
  if (!profilesResult.error) {
    for (const row of (profilesResult.data ?? []) as Array<{
      id: string;
      full_name: string | null;
    }>) {
      if (row.full_name?.trim()) {
        names.set(row.id, row.full_name.trim());
      }
    }
  }

  const actorLabel = (profileId: string | null | undefined) =>
    profileId ? names.get(profileId) ?? "Membru al echipei" : null;

  const executionFindings: RecoveryExecutionFindingInput[] =
    executionRows.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      opportunityId: row.opportunity_id,
      caseKey: row.case_key,
      findingKey: row.finding_key,
      code: row.code,
      severity: row.severity,
      sourceType: row.source_type,
      sourceId: row.source_id,
      label: row.label,
      explanation: row.explanation,
      safeActionLabel: row.safe_action_label,
      safeActionHref: row.safe_action_href,
      evidenceRefs: executionEvidence(
        row.opportunity_id,
        row.evidence_refs
      ),
      state: row.state,
      firstDetectedAt: row.first_detected_at,
      lastDetectedAt: row.last_detected_at,
      lastEvaluatedAt: row.last_evaluated_at,
      resolvedAt: row.resolved_at
    }));

  const contextFindings: RecoveryContextFindingInput[] =
    contextRows.flatMap((row) =>
      row.opportunity_id
        ? [
            {
              id: row.id,
              businessId: row.business_id,
              opportunityId: row.opportunity_id,
              caseKey: row.case_key,
              findingKey: row.finding_key,
              kind: row.kind,
              severity: row.severity,
              safeAction: row.safe_action,
              evidenceRefs: contextEvidence(
                row.opportunity_id,
                row.evidence_refs
              ),
              state: row.state,
              firstDetectedAt: row.first_detected_at,
              lastDetectedAt: row.last_detected_at,
              lastEvaluatedAt: row.last_evaluated_at,
              resolutionReason: row.resolution_reason,
              resolutionNote: row.resolution_note,
              resolvedByProfileId:
                row.resolved_by_profile_id,
              resolvedAt: row.resolved_at
            }
          ]
        : []
    );

  const executionEvents: RecoveryAuditEventInput[] =
    executionEventRows.map((row) => ({
      id: row.id,
      findingId: row.finding_id,
      eventType: row.event_type,
      at: row.created_at,
      actorProfileId: row.actor_profile_id ?? null,
      actorLabel: actorLabel(row.actor_profile_id),
      note: row.note ?? null
    }));

  const contextEvents: RecoveryAuditEventInput[] =
    contextEventRows.map((row) => ({
      id: row.id,
      findingId: row.finding_id,
      eventType: row.event_type,
      at: row.created_at,
      actorProfileId: row.actor_profile_id ?? null,
      actorLabel: actorLabel(row.actor_profile_id),
      note: row.note ?? null
    }));

  const opportunityEvents: RecoveryOpportunityEventInput[] =
    opportunityEventRows.map((row) => ({
      id: row.id,
      opportunityId: row.opportunity_id,
      eventType: row.event_type,
      label: row.label,
      description: row.description,
      at: row.occurred_at,
      actorProfileId: row.actor_profile_id,
      actorLabel: actorLabel(row.actor_profile_id),
      metadata: object(row.metadata)
    }));

  const signalEvents: RecoverySignalEventInput[] =
    signalEventRows.map((row) => ({
      id: row.id,
      signalId: row.signal_id,
      eventType: row.event_type,
      description:
        row.description?.trim() ||
        "Decizie de aprobare înregistrată",
      at: row.created_at,
      actorProfileId: row.created_by_profile_id,
      actorLabel: actorLabel(row.created_by_profile_id)
    }));

  return buildRecoveryTimelineModel({
    opportunities: scoped,
    executionFindings,
    contextFindings,
    executionEvents,
    contextEvents,
    opportunityEvents,
    signalEvents,
    now,
    windowDays: RECOVERY_TIMELINE_LIMITS.windowDays,
    coverage:
      coverage === "partial" ||
      Boolean(executionEventsResult.error) ||
      Boolean(contextEventsResult.error) ||
      Boolean(signalEventsResult.error)
        ? "partial"
        : "complete"
  });
}
