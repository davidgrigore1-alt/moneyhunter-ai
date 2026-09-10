import type {
  ContextIntegrityCoverageStatus,
  ContextIntegrityFinding,
  ContextIntegrityFindingState,
  ContextIntegrityResolutionReason,
  ContextIntegrityVisibility
} from "./types";

export const CONTEXT_INTEGRITY_LIFECYCLE_VERSION =
  "context-integrity-lifecycle/1" as const;

export const CONTEXT_INTEGRITY_LIFECYCLE_LIMITS = {
  caseKey: 2048,
  findingKey: 4096,
  evidenceRefs: 6,
  sourceId: 256,
  sourceRevision: 256,
  sourceTitle: 240,
  sourceLocation: 240,
  resolutionNote: 1000
} as const;

export type PersistedContextIntegrityEvidenceRef = {
  sourceType: string;
  sourceId: string;
  sourceRevision: string | null;
  sourceDocumentId: string | null;
  sourceSegmentId: string | null;
  title: string | null;
  sourceLocation: string | null;
  occurredAt: string | null;
  provider: string | null;
};

export type ContextIntegrityPersistentSnapshot = {
  lifecycleVersion: typeof CONTEXT_INTEGRITY_LIFECYCLE_VERSION;
  businessId: string;
  opportunityId: string | null;
  caseKey: string;
  findingKey: string;
  contractVersion: string;
  visibility: ContextIntegrityVisibility;
  kind: ContextIntegrityFinding["kind"];
  subjectType: ContextIntegrityFinding["subject"]["type"];
  subjectId: string;
  field: ContextIntegrityFinding["field"];
  severity: ContextIntegrityFinding["severity"];
  evidenceStrength: ContextIntegrityFinding["evidenceStrength"];
  reasonCode: ContextIntegrityFinding["reasonCode"];
  safeAction: ContextIntegrityFinding["safeAction"];
  canonicalObservationId: string;
  conflictingObservationIds: string[];
  evidenceRefs: PersistedContextIntegrityEvidenceRef[];
  evaluatedAt: string;
};

export type ContextIntegrityExistingCase = ContextIntegrityPersistentSnapshot & {
  id: string;
  state: ContextIntegrityFindingState;
  rowVersion: number;
  detectionCount: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
  resolutionReason: ContextIntegrityResolutionReason | null;
  resolutionNote: string | null;
  resolvedByProfileId: string | null;
  resolvedAt: string | null;
};


export type ContextIntegrityPersistenceCase = {
  id: string;
  caseKey: string;
  findingKey: string;
  state: ContextIntegrityFindingState;
  rowVersion: number;
  detectionCount: number;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
  resolutionReason: ContextIntegrityResolutionReason | null;
  resolvedAt: string | null;
};

export type ContextIntegrityPersistenceResult = {
  status: "saved" | "unavailable";
  created: number;
  observed: number;
  changed: number;
  reopened: number;
  superseded: number;
  held: number;
  cases: ContextIntegrityPersistenceCase[];
  reason: string | null;
};

export type ContextIntegrityLifecycleOperation =
  | {
      type: "create";
      snapshot: ContextIntegrityPersistentSnapshot;
      eventType: "detected";
    }
  | {
      type: "observe";
      id: string;
      expectedRowVersion: number;
      snapshot: ContextIntegrityPersistentSnapshot;
      preserveState: ContextIntegrityFindingState;
      eventType: "observed";
    }
  | {
      type: "refresh";
      id: string;
      expectedRowVersion: number;
      snapshot: ContextIntegrityPersistentSnapshot;
      eventType: "changed";
    }
  | {
      type: "reopen";
      id: string;
      expectedRowVersion: number;
      snapshot: ContextIntegrityPersistentSnapshot;
      previousState: Extract<
        ContextIntegrityFindingState,
        "resolved" | "dismissed" | "superseded"
      >;
      eventType: "reopened";
    }
  | {
      type: "supersede";
      id: string;
      expectedRowVersion: number;
      caseKey: string;
      findingKey: string;
      evaluatedAt: string;
      eventType: "superseded";
    }
  | {
      type: "hold";
      id: string;
      caseKey: string;
      reason: "coverage_not_complete";
    };

function bounded(value: string, max: number, field: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`context_integrity_lifecycle_invalid_${field}`);
  }
  return normalized;
}

function visibilityKey(visibility: ContextIntegrityVisibility): string {
  return visibility.scope === "business"
    ? "business"
    : `owner_private:${bounded(
        visibility.ownerProfileId,
        256,
        "owner_profile_id"
      )}`;
}

function evidenceSourceIdentity(
  evidence: ContextIntegrityFinding["evidence"][number]
): string {
  return `${evidence.sourceType}:${bounded(
    evidence.sourceId,
    CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceId,
    "source_id"
  )}`;
}

export function deriveContextIntegrityCaseKey(
  finding: ContextIntegrityFinding
): string {
  const sourceIdentities = Array.from(
    new Set(finding.evidence.map(evidenceSourceIdentity))
  ).sort();

  const key = [
    CONTEXT_INTEGRITY_LIFECYCLE_VERSION,
    finding.businessId,
    visibilityKey(finding.visibility),
    finding.kind,
    finding.subject.type,
    finding.subject.canonicalId,
    finding.field,
    ...sourceIdentities
  ]
    .map((part) => encodeURIComponent(part))
    .join("|");

  return bounded(
    key,
    CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.caseKey,
    "case_key"
  );
}

function validIso(value: string | null | undefined): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return value;
}

function nullableBounded(
  value: string | null | undefined,
  max: number,
  field: string
): string | null {
  if (!value?.trim()) return null;
  return bounded(value, max, field);
}

export function minimizeContextIntegrityEvidence(
  evidence: ContextIntegrityFinding["evidence"]
): PersistedContextIntegrityEvidenceRef[] {
  const unique = new Map<string, PersistedContextIntegrityEvidenceRef>();

  for (const item of evidence) {
    const sourceId = bounded(
      item.sourceId,
      CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceId,
      "source_id"
    );
    const identity = `${item.sourceType}:${sourceId}:${
      item.sourceSegmentId ?? ""
    }`;

    if (unique.has(identity)) continue;

    unique.set(identity, {
      sourceType: item.sourceType,
      sourceId,
      sourceRevision: nullableBounded(
        item.sourceVersion,
        CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceRevision,
        "source_revision"
      ),
      sourceDocumentId: nullableBounded(
        item.sourceDocumentId,
        CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceId,
        "source_document_id"
      ),
      sourceSegmentId: nullableBounded(
        item.sourceSegmentId,
        CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceId,
        "source_segment_id"
      ),
      title: nullableBounded(
        item.title,
        CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceTitle,
        "source_title"
      ),
      sourceLocation: nullableBounded(
        item.sourceLocation,
        CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.sourceLocation,
        "source_location"
      ),
      occurredAt: validIso(item.occurredAt),
      provider: nullableBounded(item.provider, 64, "provider")
    });

    if (
      unique.size >= CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.evidenceRefs
    ) {
      break;
    }
  }

  return Array.from(unique.values());
}

export function toContextIntegrityPersistentSnapshot(input: {
  finding: ContextIntegrityFinding;
  opportunityId?: string | null;
  evaluatedAt: string;
}): ContextIntegrityPersistentSnapshot {
  if (!Number.isFinite(Date.parse(input.evaluatedAt))) {
    throw new Error("context_integrity_lifecycle_invalid_evaluated_at");
  }

  return {
    lifecycleVersion: CONTEXT_INTEGRITY_LIFECYCLE_VERSION,
    businessId: bounded(input.finding.businessId, 256, "business_id"),
    opportunityId: input.opportunityId?.trim() || null,
    caseKey: deriveContextIntegrityCaseKey(input.finding),
    findingKey: bounded(
      input.finding.key,
      CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.findingKey,
      "finding_key"
    ),
    contractVersion: input.finding.contractVersion,
    visibility: input.finding.visibility,
    kind: input.finding.kind,
    subjectType: input.finding.subject.type,
    subjectId: bounded(
      input.finding.subject.canonicalId,
      256,
      "subject_id"
    ),
    field: input.finding.field,
    severity: input.finding.severity,
    evidenceStrength: input.finding.evidenceStrength,
    reasonCode: input.finding.reasonCode,
    safeAction: input.finding.safeAction,
    canonicalObservationId: bounded(
      input.finding.canonicalObservationId,
      512,
      "canonical_observation_id"
    ),
    conflictingObservationIds: Array.from(
      new Set(input.finding.conflictingObservationIds)
    )
      .sort()
      .slice(0, 32),
    evidenceRefs: minimizeContextIntegrityEvidence(input.finding.evidence),
    evaluatedAt: input.evaluatedAt
  };
}

function byCaseKey<T extends { caseKey: string }>(
  values: T[]
): Map<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    if (result.has(value.caseKey)) {
      throw new Error("context_integrity_lifecycle_duplicate_case_key");
    }
    result.set(value.caseKey, value);
  }
  return result;
}

export function planContextIntegrityReconciliation(input: {
  existing: ContextIntegrityExistingCase[];
  detected: ContextIntegrityPersistentSnapshot[];
  coverageStatus: ContextIntegrityCoverageStatus;
  evaluatedAt: string;
}): ContextIntegrityLifecycleOperation[] {
  if (!Number.isFinite(Date.parse(input.evaluatedAt))) {
    throw new Error("context_integrity_lifecycle_invalid_evaluated_at");
  }

  const existing = byCaseKey(input.existing);
  const detected = byCaseKey(input.detected);
  const operations: ContextIntegrityLifecycleOperation[] = [];

  for (const snapshot of input.detected) {
    const current = existing.get(snapshot.caseKey);

    if (!current) {
      operations.push({
        type: "create",
        snapshot,
        eventType: "detected"
      });
      continue;
    }

    if (
      current.findingKey === snapshot.findingKey &&
      current.state !== "superseded"
    ) {
      operations.push({
        type: "observe",
        id: current.id,
        expectedRowVersion: current.rowVersion,
        snapshot,
        preserveState: current.state,
        eventType: "observed"
      });
      continue;
    }

    if (
      current.state === "resolved" ||
      current.state === "dismissed" ||
      current.state === "superseded"
    ) {
      operations.push({
        type: "reopen",
        id: current.id,
        expectedRowVersion: current.rowVersion,
        snapshot,
        previousState: current.state,
        eventType: "reopened"
      });
      continue;
    }

    operations.push({
      type: "refresh",
      id: current.id,
      expectedRowVersion: current.rowVersion,
      snapshot,
      eventType: "changed"
    });
  }

  for (const current of input.existing) {
    if (detected.has(current.caseKey)) continue;
    if (
      current.state !== "open" &&
      current.state !== "needs_review"
    ) {
      continue;
    }

    if (input.coverageStatus !== "complete") {
      operations.push({
        type: "hold",
        id: current.id,
        caseKey: current.caseKey,
        reason: "coverage_not_complete"
      });
      continue;
    }

    operations.push({
      type: "supersede",
      id: current.id,
      expectedRowVersion: current.rowVersion,
      caseKey: current.caseKey,
      findingKey: current.findingKey,
      evaluatedAt: input.evaluatedAt,
      eventType: "superseded"
    });
  }

  return operations.sort((left, right) => {
    const leftKey =
      "snapshot" in left ? left.snapshot.caseKey : left.caseKey;
    const rightKey =
      "snapshot" in right ? right.snapshot.caseKey : right.caseKey;
    return leftKey.localeCompare(rightKey);
  });
}

export function validateContextIntegrityResolutionInput(input: {
  expectedRowVersion: number;
  expectedFindingKey: string;
  reason: ContextIntegrityResolutionReason;
  note?: string | null;
}): {
  expectedRowVersion: number;
  expectedFindingKey: string;
  reason: ContextIntegrityResolutionReason;
  note: string | null;
} {
  if (
    !Number.isInteger(input.expectedRowVersion) ||
    input.expectedRowVersion < 1
  ) {
    throw new Error("context_integrity_resolution_invalid_row_version");
  }

  const note = input.note?.trim() || null;
  if (
    note &&
    note.length > CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.resolutionNote
  ) {
    throw new Error("context_integrity_resolution_note_too_long");
  }

  return {
    expectedRowVersion: input.expectedRowVersion,
    expectedFindingKey: bounded(
      input.expectedFindingKey,
      CONTEXT_INTEGRITY_LIFECYCLE_LIMITS.findingKey,
      "finding_key"
    ),
    reason: input.reason,
    note
  };
}
