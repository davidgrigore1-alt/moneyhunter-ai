"use server";

import { revalidatePath } from "next/cache";
import { getCommercialTruthForOpportunity } from "@/lib/commercial-truth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidPattern } from "@/lib/google-workspace/drive-types";
import {
  validateContextIntegrityResolutionInput
} from "./lifecycle";
import type {
  ContextIntegrityFindingState,
  ContextIntegrityResolutionReason
} from "./types";

export type ContextIntegrityResolutionActionResult =
  | {
      ok: true;
      state: Extract<ContextIntegrityFindingState, "resolved" | "dismissed">;
      reason: ContextIntegrityResolutionReason;
      rowVersion: number;
      findingKey: string;
      resolvedAt: string;
    }
  | {
      ok: false;
      code: "invalid" | "stale" | "forbidden" | "unavailable";
      error: string;
    };

const allowedReasons = new Set<ContextIntegrityResolutionReason>([
  "kept_current_context",
  "source_belongs_elsewhere",
  "observation_marked_historical",
  "dismissed_with_reason"
]);

function failure(
  code: Extract<ContextIntegrityResolutionActionResult, { ok: false }>["code"],
  error: string
): ContextIntegrityResolutionActionResult {
  return { ok: false, code, error };
}

export async function resolveContextIntegrityFindingAction(input: {
  opportunityId: string;
  findingId: string;
  expectedRowVersion: number;
  expectedFindingKey: string;
  reason: ContextIntegrityResolutionReason;
  note?: string | null;
}): Promise<ContextIntegrityResolutionActionResult> {
  if (
    !uuidPattern.test(input.opportunityId) ||
    !uuidPattern.test(input.findingId) ||
    !allowedReasons.has(input.reason)
  ) {
    return failure("invalid", "Decizia nu a putut fi validată.");
  }

  let validated: ReturnType<typeof validateContextIntegrityResolutionInput>;
  try {
    validated = validateContextIntegrityResolutionInput({
      expectedRowVersion: input.expectedRowVersion,
      expectedFindingKey: input.expectedFindingKey,
      reason: input.reason,
      note: input.note
    });
  } catch {
    return failure("invalid", "Decizia nu a putut fi validată.");
  }

  if (
    validated.reason === "dismissed_with_reason" &&
    (!validated.note || validated.note.length < 3)
  ) {
    return failure(
      "invalid",
      "Adaugă un motiv scurt pentru respingerea constatării."
    );
  }

  try {
    // Fresh deterministic read first. This also reconciles the current finding
    // snapshot before the human compare-and-set decision is attempted.
    const truth = await getCommercialTruthForOpportunity(input.opportunityId);
    const currentFinding = truth.contextIntegrity?.findings.find(
      (finding) => finding.key === validated.expectedFindingKey
    );

    if (!currentFinding) {
      return failure(
        "stale",
        "Contextul s-a schimbat. Rulează din nou analiza înainte de a decide."
      );
    }

    const persistence = truth.contextIntegrityPersistence;
    if (persistence?.status !== "saved") {
      return failure(
        "unavailable",
        "Revizuirea nu poate fi salvată momentan. Datele nu au fost modificate."
      );
    }

    const currentCase = persistence.cases.find(
      (item) =>
        item.id === input.findingId &&
        item.findingKey === validated.expectedFindingKey
    );

    if (
      !currentCase ||
      currentCase.rowVersion !== validated.expectedRowVersion ||
      currentCase.state === "superseded"
    ) {
      return failure(
        "stale",
        "Contextul s-a schimbat. Rulează din nou analiza înainte de a decide."
      );
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return failure(
        "unavailable",
        "Revizuirea nu poate fi salvată momentan. Datele nu au fost modificate."
      );
    }

    const { data, error } = await supabase.rpc(
      "resolve_context_integrity_finding_v1",
      {
        target_finding_id: input.findingId,
        expected_row_version: validated.expectedRowVersion,
        expected_finding_key: validated.expectedFindingKey,
        target_reason: validated.reason,
        target_note: validated.note
      }
    );

    if (error) {
      if (error.code === "42501") {
        return failure(
          "forbidden",
          "Nu ai permisiunea necesară pentru această decizie."
        );
      }
      return failure(
        "unavailable",
        "Revizuirea nu poate fi salvată momentan. Datele nu au fost modificate."
      );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return failure("unavailable", "Răspunsul de salvare nu este valid.");
    }

    const payload = data as Record<string, unknown>;
    if (payload.status === "conflict") {
      return failure(
        "stale",
        "Contextul s-a schimbat. Rulează din nou analiza înainte de a decide."
      );
    }

    const state =
      payload.state === "resolved" || payload.state === "dismissed"
        ? payload.state
        : null;
    const rowVersion =
      Number.isInteger(payload.row_version) && Number(payload.row_version) >= 1
        ? Number(payload.row_version)
        : null;
    const findingKey =
      typeof payload.finding_key === "string" ? payload.finding_key : null;
    const resolvedAt =
      typeof payload.resolved_at === "string" &&
      Number.isFinite(Date.parse(payload.resolved_at))
        ? payload.resolved_at
        : null;

    if (
      payload.status !== "resolved" ||
      !state ||
      !rowVersion ||
      findingKey !== validated.expectedFindingKey ||
      !resolvedAt
    ) {
      return failure("unavailable", "Răspunsul de salvare nu este valid.");
    }

    revalidatePath(`/opportunities/${input.opportunityId}`);

    return {
      ok: true,
      state,
      reason: validated.reason,
      rowVersion,
      findingKey,
      resolvedAt
    };
  } catch {
    return failure(
      "unavailable",
      "Revizuirea nu poate fi salvată momentan. Datele nu au fost modificate."
    );
  }
}
