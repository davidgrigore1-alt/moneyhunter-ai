import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ExecutionIntegrityFinding } from "./detector";

export type ExecutionIntegrityReconciliationResult = {
  status: "saved" | "unavailable";
  created: number;
  observed: number;
  changed: number;
  reopened: number;
  resolved: number;
  held: number;
  reason: string | null;
};

function count(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function unavailable(reason: string): ExecutionIntegrityReconciliationResult {
  return {
    status: "unavailable",
    created: 0,
    observed: 0,
    changed: 0,
    reopened: 0,
    resolved: 0,
    held: 0,
    reason
  };
}

export async function reconcileExecutionIntegrityWorkspace(input: {
  businessId: string;
  evaluatedAt: string;
  evaluations: Array<{
    opportunityId: string;
    coverageComplete: boolean;
    findings: ExecutionIntegrityFinding[];
  }>;
}): Promise<ExecutionIntegrityReconciliationResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) return unavailable("admin_client_unavailable");

  const evaluations = input.evaluations.map((evaluation) => ({
    opportunityId: evaluation.opportunityId,
    coverageComplete: evaluation.coverageComplete,
    findings: evaluation.findings.map((finding) => ({
      version: finding.version,
      caseKey: finding.caseKey,
      findingKey: finding.findingKey,
      code: finding.code,
      severity: finding.severity,
      sourceType: finding.sourceType,
      sourceId: finding.sourceId,
      label: finding.label,
      explanation: finding.explanation,
      safeActionLabel: finding.safeActionLabel,
      safeActionHref: finding.safeActionHref,
      evidenceRefs: finding.evidenceRefs
    }))
  }));

  const { data, error } = await admin.rpc(
    "reconcile_execution_integrity_workspace_v1",
    {
      target_business_id: input.businessId,
      target_evaluated_at: input.evaluatedAt,
      evaluations
    }
  );

  if (error) {
    return unavailable(`reconcile_failed:${error.code ?? "unknown"}`);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return unavailable("invalid_reconcile_response");
  }

  const payload = data as Record<string, unknown>;
  if (payload.status !== "saved") {
    return unavailable("invalid_reconcile_status");
  }

  return {
    status: "saved",
    created: count(payload.created),
    observed: count(payload.observed),
    changed: count(payload.changed),
    reopened: count(payload.reopened),
    resolved: count(payload.resolved),
    held: count(payload.held),
    reason: null
  };
}
