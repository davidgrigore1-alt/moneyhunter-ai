import "server-only";

import { revalidateCommercialState } from "@/lib/commercial-state-invalidation";
import { getCommercialSignalsForOpportunity } from "@/lib/commercial-inbox";
import { buildOpportunityCommercialState } from "@/lib/opportunity-commercial-state";
import {
  getCurrentBusinessOrDemo,
  getOpportunityForCurrentBusiness
} from "@/lib/supabase/data";
import { buildExecutionIntegrityFindings } from "./detector";
import {
  reconcileExecutionIntegrityWorkspace,
  type ExecutionIntegrityReconciliationResult
} from "./repository";

export type ImmediateExecutionIntegrityResult =
  ExecutionIntegrityReconciliationResult & {
    opportunityId: string;
    activeCount: number;
  };

function unavailable(
  opportunityId: string,
  reason: string
): ImmediateExecutionIntegrityResult {
  return {
    status: "unavailable",
    opportunityId,
    activeCount: 0,
    created: 0,
    observed: 0,
    changed: 0,
    reopened: 0,
    resolved: 0,
    held: 0,
    reason
  };
}

/**
 * Re-evaluates one opportunity after a successful first-party mutation.
 *
 * The mutation remains authoritative. Failure to refresh Execution Integrity
 * never rolls back or reports the underlying business action as failed.
 *
 * Coverage is marked complete only after the fresh opportunity AND all linked
 * commercial signals have been loaded successfully.
 */
export async function reevaluateExecutionIntegrityAfterMutation(
  opportunityId: string
): Promise<ImmediateExecutionIntegrityResult> {
  const safeOpportunityId = opportunityId.trim();

  if (!safeOpportunityId || safeOpportunityId.length > 128) {
    return unavailable(opportunityId, "invalid_opportunity_id");
  }

  try {
    const [business, opportunity] = await Promise.all([
      getCurrentBusinessOrDemo({ redirectIfMissing: true }),
      getOpportunityForCurrentBusiness(safeOpportunityId)
    ]);

    if (!business || !opportunity) {
      return unavailable(safeOpportunityId, "opportunity_unavailable");
    }

    if (
      !opportunity.businessId ||
      opportunity.businessId !== business.id
    ) {
      return unavailable(safeOpportunityId, "scope_mismatch");
    }

    // Signal coverage is mandatory because pending approval is one of the
    // durable Execution Integrity rules. If this read fails, the catch below
    // preserves existing open cases instead of falsely resolving them.
    const linkedSignals =
      await getCommercialSignalsForOpportunity(safeOpportunityId);

    const state = buildOpportunityCommercialState(opportunity, {
      businessId: business.id,
      now: new Date(),
      linkedSignals
    });

    const findings = buildExecutionIntegrityFindings(state);

    const reconciled = await reconcileExecutionIntegrityWorkspace({
      businessId: business.id,
      evaluatedAt: state.evaluatedAt,
      evaluations: [
        {
          opportunityId: safeOpportunityId,
          coverageComplete: true,
          findings
        }
      ]
    });

    return {
      ...reconciled,
      opportunityId: safeOpportunityId,
      activeCount:
        reconciled.status === "saved" ? findings.length : 0
    };
  } catch (error) {
    console.error("execution_integrity_immediate_refresh_failed", {
      reason: error instanceof Error ? error.name : "unknown"
    });
    return unavailable(safeOpportunityId, "evaluation_failed");
  } finally {
    // Run after reconciliation so router.refresh()/the next request sees the
    // new durable state. Route invalidation itself must not break the original
    // business mutation.
    try {
      revalidateCommercialState(safeOpportunityId);
    } catch {
      console.error("execution_integrity_route_invalidation_failed", {
        reason: "revalidation_error"
      });
    }
  }
}
