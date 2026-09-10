"use server";

import {
  addCommercialSignalEvent as addCommercialSignalEventData,
  analyzeCommercialSignal as analyzeCommercialSignalData,
  approveCommercialSignal as approveCommercialSignalData,
  archiveCommercialSignal as archiveCommercialSignalData,
  convertSignalToOpportunity as convertSignalToOpportunityData,
  createCommercialSignal as createCommercialSignalData,
  ignoreCommercialSignal as ignoreCommercialSignalData,
  rejectCommercialSignal as rejectCommercialSignalData,
  setCommercialSignalReviewDecision as setCommercialSignalReviewDecisionData,
  updateCommercialSignal as updateCommercialSignalData,
  type CommercialSignalInput,
  type SignalApprovalInput
} from "@/lib/commercial-inbox";
import { requireActivePaidAccess } from "@/lib/billing/paid-access";
import { requirePermission } from "@/lib/authz/require-permission";
import { reevaluateExecutionIntegrityAfterMutation } from "@/lib/execution-integrity/immediate";

function linkedOpportunityIdFromMutation(result: unknown): string | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }

  const row = result as {
    ok?: unknown;
    opportunityId?: unknown;
    signal?: {
      detectedFromOpportunityId?: unknown;
      convertedOpportunityId?: unknown;
    } | null;
  };

  if (row.ok !== true) return null;

  const candidates = [
    row.opportunityId,
    row.signal?.convertedOpportunityId,
    row.signal?.detectedFromOpportunityId
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.length > 0 &&
      candidate.length <= 128
    ) {
      return candidate;
    }
  }

  return null;
}

async function settleSignalExecutionIntegrity<T>(result: T): Promise<T> {
  const opportunityId = linkedOpportunityIdFromMutation(result);
  if (opportunityId) {
    await reevaluateExecutionIntegrityAfterMutation(opportunityId);
  }
  return result;
}

export async function createCommercialSignal(input: CommercialSignalInput) {
  await requireActivePaidAccess();
  await requirePermission("signals.create");
  const result = await createCommercialSignalData(input);
  return settleSignalExecutionIntegrity(result);
}

export async function analyzeCommercialSignal(signalId: string) {
  await requireActivePaidAccess();
  await requirePermission("opportunities.analyze");
  const result = await analyzeCommercialSignalData(signalId);
  return settleSignalExecutionIntegrity(result);
}

export async function approveCommercialSignal(signalId: string, input: SignalApprovalInput) {
  await requireActivePaidAccess();
  await requirePermission("signals.convert");
  const result = await approveCommercialSignalData(signalId, input);
  return settleSignalExecutionIntegrity(result);
}

export async function setCommercialSignalReviewDecision(
  signalId: string,
  decision: "duplicate" | "postponed",
  reason: string,
  reviewDueAt?: string
) {
  await requireActivePaidAccess();
  await requirePermission(decision === "postponed" ? "signals.update" : "signals.archive");
  const result = await setCommercialSignalReviewDecisionData(
    signalId,
    decision,
    reason,
    reviewDueAt
  );
  return settleSignalExecutionIntegrity(result);
}

export async function rejectCommercialSignal(signalId: string, expectedUpdatedAt: string, reason: string) {
  await requireActivePaidAccess();
  await requirePermission("signals.archive");
  const result = await rejectCommercialSignalData(
    signalId,
    expectedUpdatedAt,
    reason
  );
  return settleSignalExecutionIntegrity(result);
}

export async function updateCommercialSignal(id: string, input: CommercialSignalInput) {
  await requireActivePaidAccess();
  await requirePermission("signals.update");
  const result = await updateCommercialSignalData(id, input);
  return settleSignalExecutionIntegrity(result);
}

export async function ignoreCommercialSignal(id: string) {
  await requireActivePaidAccess();
  await requirePermission("signals.archive");
  const result = await ignoreCommercialSignalData(id);
  return settleSignalExecutionIntegrity(result);
}

export async function archiveCommercialSignal(id: string, reason?: string) {
  await requireActivePaidAccess();
  await requirePermission("signals.archive");
  const result = await archiveCommercialSignalData(id, reason);
  return settleSignalExecutionIntegrity(result);
}

export async function convertSignalToOpportunity(signalId: string, expectedUpdatedAt: string) {
  await requireActivePaidAccess();
  await requirePermission("signals.convert");
  const result = await convertSignalToOpportunityData(
    signalId,
    expectedUpdatedAt
  );
  return settleSignalExecutionIntegrity(result);
}

export async function addCommercialSignalEvent(signalId: string, eventType: string, description: string, metadata: Record<string, unknown> = {}) {
  await requireActivePaidAccess();
  await requirePermission("signals.update");
  return addCommercialSignalEventData(signalId, eventType, description, metadata);
}
