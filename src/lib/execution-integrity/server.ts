import "server-only";

import { requirePermission } from "@/lib/authz/require-permission";
import { getCurrentBusinessForUser } from "@/lib/business/current-business";
import { buildOpportunityCommercialState } from "@/lib/opportunity-commercial-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CommercialSignal, Opportunity } from "@/lib/types";
import {
  buildExecutionIntegrityFindings,
  type ExecutionIntegrityCode,
  type ExecutionIntegrityPersistenceCase,
  type ExecutionIntegritySeverity
} from "./detector";
import { reconcileExecutionIntegrityWorkspace } from "./repository";

export type ExecutionIntegrityWorkspaceState = {
  status: "saved" | "unavailable";
  cases: ExecutionIntegrityPersistenceCase[];
  byOpportunityId: Record<string, ExecutionIntegrityPersistenceCase[]>;
  activeCaseCount: number;
  reason: string | null;
};

type Row = {
  id: string;
  business_id: string;
  opportunity_id: string;
  case_key: string;
  finding_key: string;
  code: ExecutionIntegrityCode;
  severity: ExecutionIntegritySeverity;
  state: "open";
  row_version: number;
  detection_count: number;
  first_detected_at: string;
  last_detected_at: string;
  last_evaluated_at: string;
};

function unavailable(reason: string): ExecutionIntegrityWorkspaceState {
  return {
    status: "unavailable",
    cases: [],
    byOpportunityId: {},
    activeCaseCount: 0,
    reason
  };
}

export async function getExecutionIntegrityWorkspaceState(input: {
  opportunities: Opportunity[];
  signals: CommercialSignal[];
  now?: Date;
}): Promise<ExecutionIntegrityWorkspaceState> {
  await requirePermission("opportunities.read");

  const current = await getCurrentBusinessForUser({
    redirectIfMissing: true
  });
  if (!current) return unavailable("business_unavailable");

  if (
    input.opportunities.some(
      (item) =>
        item.businessId && item.businessId !== current.business.id
    )
  ) {
    throw new Error("execution_integrity_scope_forbidden");
  }

  const now = input.now ?? new Date();
  const opportunities = input.opportunities.slice(0, 100);

  const evaluations = opportunities.map((opportunity) => {
    const linkedSignals = input.signals.filter(
      (signal) =>
        signal.businessId === current.business.id &&
        (signal.detectedFromOpportunityId === opportunity.id ||
          signal.convertedOpportunityId === opportunity.id)
    );

    const state = buildOpportunityCommercialState(opportunity, {
      businessId: current.business.id,
      now,
      linkedSignals
    });

    return {
      opportunityId: opportunity.id,
      coverageComplete: true,
      findings: buildExecutionIntegrityFindings(state)
    };
  });

  const reconciled = await reconcileExecutionIntegrityWorkspace({
    businessId: current.business.id,
    evaluatedAt: now.toISOString(),
    evaluations
  });

  if (reconciled.status !== "saved") {
    return unavailable(reconciled.reason ?? "persistence_unavailable");
  }

  const ids = opportunities.map((item) => item.id);
  if (!ids.length) {
    return {
      status: "saved",
      cases: [],
      byOpportunityId: {},
      activeCaseCount: 0,
      reason: null
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable("server_client_unavailable");

  const result = await supabase
    .from("execution_integrity_findings")
    .select(
      "id,business_id,opportunity_id,case_key,finding_key,code,severity,state,row_version,detection_count,first_detected_at,last_detected_at,last_evaluated_at"
    )
    .eq("business_id", current.business.id)
    .in("opportunity_id", ids)
    .eq("state", "open")
    .order("first_detected_at", { ascending: true })
    .order("id")
    .limit(256);

  if (result.error) {
    return unavailable(`read_failed:${result.error.code ?? "unknown"}`);
  }

  const cases: ExecutionIntegrityPersistenceCase[] = (
    (result.data ?? []) as Row[]
  ).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    opportunityId: row.opportunity_id,
    caseKey: row.case_key,
    findingKey: row.finding_key,
    code: row.code,
    severity: row.severity,
    state: row.state,
    rowVersion: row.row_version,
    detectionCount: row.detection_count,
    firstDetectedAt: row.first_detected_at,
    lastDetectedAt: row.last_detected_at,
    lastEvaluatedAt: row.last_evaluated_at
  }));

  const byOpportunityId: Record<
    string,
    ExecutionIntegrityPersistenceCase[]
  > = {};

  for (const item of cases) {
    (byOpportunityId[item.opportunityId] ??= []).push(item);
  }

  return {
    status: "saved",
    cases,
    byOpportunityId,
    activeCaseCount: cases.length,
    reason: null
  };
}
