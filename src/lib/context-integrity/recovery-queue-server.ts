import "server-only";

import { getCurrentBusinessForUser } from "@/lib/business/current-business";
import { requirePermission } from "@/lib/authz/require-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/lib/types";
import {
  buildContextIntegrityRecoveryQueue,
  CONTEXT_INTEGRITY_RECOVERY_LIMITS,
  type ContextIntegrityRecoveryFinding,
  type ContextIntegrityRecoveryQueue
} from "./recovery-queue";
import type {
  ContextIntegrityField,
  ContextIntegrityFindingKind,
  ContextIntegritySafeAction,
  ContextIntegritySeverity
} from "./types";

type FindingRow = {
  id: string;
  business_id: string;
  opportunity_id: string | null;
  kind: ContextIntegrityFindingKind;
  field: ContextIntegrityField;
  severity: ContextIntegritySeverity;
  state: "open" | "needs_review";
  safe_action: ContextIntegritySafeAction;
  first_detected_at: string;
  last_detected_at: string;
  last_evaluated_at: string;
};

export async function getContextIntegrityRecoveryQueue(
  opportunities: Opportunity[],
  now = new Date()
): Promise<ContextIntegrityRecoveryQueue | null> {
  await requirePermission("opportunities.read");

  const current = await getCurrentBusinessForUser({
    redirectIfMissing: true
  });

  if (!current) return null;

  if (
    opportunities.some(
      (item) =>
        item.businessId && item.businessId !== current.business.id
    )
  ) {
    throw new Error("context_integrity_recovery_tenant_scope_forbidden");
  }

  const opportunityIds = Array.from(
    new Set(
      opportunities
        .filter(
          (item) =>
            !item.businessId ||
            item.businessId === current.business.id
        )
        .map((item) => item.id)
    )
  );

  if (!opportunityIds.length) {
    return buildContextIntegrityRecoveryQueue({
      businessId: current.business.id,
      opportunities: [],
      findings: [],
      now
    });
  }

  const scopedIds = opportunityIds.slice(
    0,
    CONTEXT_INTEGRITY_RECOVERY_LIMITS.opportunities
  );

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const result = await supabase
    .from("context_integrity_findings")
    .select(
      "id,business_id,opportunity_id,kind,field,severity,state,safe_action,first_detected_at,last_detected_at,last_evaluated_at"
    )
    .eq("business_id", current.business.id)
    .in("opportunity_id", scopedIds)
    .in("state", ["open", "needs_review"])
    .order("first_detected_at", { ascending: true })
    .order("id")
    .limit(CONTEXT_INTEGRITY_RECOVERY_LIMITS.findings + 1);

  if (result.error) return null;

  const rawRows = (result.data ?? []) as FindingRow[];
  const limited =
    opportunityIds.length >
      CONTEXT_INTEGRITY_RECOVERY_LIMITS.opportunities ||
    rawRows.length > CONTEXT_INTEGRITY_RECOVERY_LIMITS.findings;

  const findings: ContextIntegrityRecoveryFinding[] = rawRows
    .slice(0, CONTEXT_INTEGRITY_RECOVERY_LIMITS.findings)
    .flatMap((row) =>
      row.opportunity_id
        ? [
            {
              id: row.id,
              businessId: row.business_id,
              opportunityId: row.opportunity_id,
              kind: row.kind,
              field: row.field,
              severity: row.severity,
              state: row.state,
              safeAction: row.safe_action,
              firstDetectedAt: row.first_detected_at,
              lastDetectedAt: row.last_detected_at,
              lastEvaluatedAt: row.last_evaluated_at
            }
          ]
        : []
    );

  return buildContextIntegrityRecoveryQueue({
    businessId: current.business.id,
    opportunities,
    findings,
    limited,
    now
  });
}
