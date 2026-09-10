import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  toContextIntegrityPersistentSnapshot,
  type ContextIntegrityPersistenceCase,
  type ContextIntegrityPersistenceResult
} from "./lifecycle";
import type { ContextIntegrityEvaluation } from "./types";

type RpcCase = {
  id?: unknown;
  case_key?: unknown;
  finding_key?: unknown;
  state?: unknown;
  row_version?: unknown;
  detection_count?: unknown;
  last_detected_at?: unknown;
  last_evaluated_at?: unknown;
  resolution_reason?: unknown;
  resolved_at?: unknown;
};

type RpcResult = {
  status?: unknown;
  created?: unknown;
  observed?: unknown;
  changed?: unknown;
  reopened?: unknown;
  superseded?: unknown;
  held?: unknown;
  cases?: unknown;
};

function finiteCount(value: unknown): number {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function maybeString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function persistenceCase(value: unknown): ContextIntegrityPersistenceCase | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as RpcCase;
  const id = maybeString(row.id);
  const caseKey = maybeString(row.case_key);
  const findingKey = maybeString(row.finding_key);
  const state = maybeString(row.state);
  const lastDetectedAt = maybeString(row.last_detected_at);
  const lastEvaluatedAt = maybeString(row.last_evaluated_at);

  if (
    !id ||
    !caseKey ||
    !findingKey ||
    !lastDetectedAt ||
    !lastEvaluatedAt ||
    !["open", "needs_review", "resolved", "dismissed", "superseded"].includes(state ?? "") ||
    !Number.isInteger(row.row_version) ||
    Number(row.row_version) < 1 ||
    !Number.isInteger(row.detection_count) ||
    Number(row.detection_count) < 1
  ) {
    return null;
  }

  return {
    id,
    caseKey,
    findingKey,
    state: state as ContextIntegrityPersistenceCase["state"],
    rowVersion: Number(row.row_version),
    detectionCount: Number(row.detection_count),
    lastDetectedAt,
    lastEvaluatedAt,
    resolutionReason: maybeString(row.resolution_reason) as ContextIntegrityPersistenceCase["resolutionReason"],
    resolvedAt: maybeString(row.resolved_at)
  };
}

function unavailable(reason: string): ContextIntegrityPersistenceResult {
  return {
    status: "unavailable",
    created: 0,
    observed: 0,
    changed: 0,
    reopened: 0,
    superseded: 0,
    held: 0,
    cases: [],
    reason
  };
}

export async function reconcileContextIntegrityForOpportunity(input: {
  businessId: string;
  opportunityId: string;
  evaluatedAt: string;
  evaluation: ContextIntegrityEvaluation;
}): Promise<ContextIntegrityPersistenceResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) return unavailable("admin_client_unavailable");

  const detected = input.evaluation.findings.map((finding) => {
    const snapshot = toContextIntegrityPersistentSnapshot({
      finding,
      opportunityId: input.opportunityId,
      evaluatedAt: input.evaluatedAt
    });

    return {
      lifecycleVersion: snapshot.lifecycleVersion,
      contractVersion: snapshot.contractVersion,
      caseKey: snapshot.caseKey,
      findingKey: snapshot.findingKey,
      visibilityScope: snapshot.visibility.scope,
      ownerProfileId:
        snapshot.visibility.scope === "owner_private"
          ? snapshot.visibility.ownerProfileId
          : null,
      kind: snapshot.kind,
      subjectType: snapshot.subjectType,
      subjectId: snapshot.subjectId,
      field: snapshot.field,
      severity: snapshot.severity,
      evidenceStrength: snapshot.evidenceStrength,
      reasonCode: snapshot.reasonCode,
      safeAction: snapshot.safeAction,
      canonicalObservationId: snapshot.canonicalObservationId,
      conflictingObservationIds: snapshot.conflictingObservationIds,
      evidenceRefs: snapshot.evidenceRefs
    };
  });

  const { data, error } = await admin.rpc("reconcile_context_integrity_v1", {
    target_business_id: input.businessId,
    target_opportunity_id: input.opportunityId,
    target_evaluated_at: input.evaluatedAt,
    target_coverage_status: input.evaluation.coverage.status,
    detected_findings: detected
  });

  if (error) return unavailable(`reconcile_failed:${error.code ?? "unknown"}`);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return unavailable("invalid_reconcile_response");
  }

  const result = data as RpcResult;
  const cases = Array.isArray(result.cases)
    ? result.cases.map(persistenceCase).filter((item): item is ContextIntegrityPersistenceCase => Boolean(item))
    : [];

  return {
    status: result.status === "saved" ? "saved" : "unavailable",
    created: finiteCount(result.created),
    observed: finiteCount(result.observed),
    changed: finiteCount(result.changed),
    reopened: finiteCount(result.reopened),
    superseded: finiteCount(result.superseded),
    held: finiteCount(result.held),
    cases,
    reason: result.status === "saved" ? null : "invalid_reconcile_status"
  };
}
