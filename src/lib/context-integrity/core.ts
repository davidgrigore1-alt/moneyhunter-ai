import type {
  ContextIntegrityComparabilityReason,
  ContextIntegrityComparabilityResult,
  ContextIntegrityCoverage,
  ContextIntegrityEvidenceStrength,
  ContextIntegrityEvaluation,
  ContextIntegrityField,
  ContextIntegrityFinding,
  ContextIntegrityFindingKind,
  ContextIntegrityObservation,
  ContextIntegritySafeAction,
  ContextIntegritySeverity,
  ContextIntegrityValue,
  ContextIntegrityVisibility
} from "./types";
import { CONTEXT_INTEGRITY_CONTRACT_VERSION } from "./types";

export const CONTEXT_INTEGRITY_LIMITS = {
  observations: 96,
  observationsPerFieldGroup: 12,
  evidencePerFinding: 6,
  findings: 32,
  limitations: 12,
  textLength: 180
} as const;

type FieldContract = {
  valueKind: ContextIntegrityValue["kind"];
  temporalPolicy: "association" | "current_observation";
  findingKind: ContextIntegrityFindingKind;
  severity: ContextIntegritySeverity;
  safeAction: ContextIntegritySafeAction;
};

export const CONTEXT_INTEGRITY_FIELD_REGISTRY: Record<ContextIntegrityField, FieldContract> = {
  customer_identity: {
    valueKind: "identity",
    temporalPolicy: "association",
    findingKind: "source_association_mismatch",
    severity: "high",
    safeAction: "review_association"
  },
  company_identity: {
    valueKind: "identity",
    temporalPolicy: "association",
    findingKind: "entity_context_mismatch",
    severity: "high",
    safeAction: "review_association"
  },
  contact_company_identity: {
    valueKind: "identity",
    temporalPolicy: "association",
    findingKind: "entity_context_mismatch",
    severity: "medium",
    safeAction: "review_association"
  },
  opportunity_company_identity: {
    valueKind: "identity",
    temporalPolicy: "association",
    findingKind: "entity_context_mismatch",
    severity: "high",
    safeAction: "review_association"
  },
  source_association: {
    valueKind: "identity",
    temporalPolicy: "association",
    findingKind: "source_association_mismatch",
    severity: "high",
    safeAction: "review_association"
  },
  estimated_value: {
    valueKind: "money",
    temporalPolicy: "current_observation",
    findingKind: "commercial_value_mismatch",
    severity: "medium",
    safeAction: "review_value"
  },
  offer_value: {
    valueKind: "money",
    temporalPolicy: "current_observation",
    findingKind: "commercial_value_mismatch",
    severity: "high",
    safeAction: "review_value"
  },
  contract_value: {
    valueKind: "money",
    temporalPolicy: "current_observation",
    findingKind: "commercial_value_mismatch",
    severity: "high",
    safeAction: "review_value"
  },
  currency: {
    valueKind: "currency",
    temporalPolicy: "current_observation",
    findingKind: "commercial_value_mismatch",
    severity: "medium",
    safeAction: "review_value"
  },
  opportunity_stage: {
    valueKind: "state",
    temporalPolicy: "current_observation",
    findingKind: "execution_state_mismatch",
    severity: "high",
    safeAction: "review_execution_state"
  },
  next_action: {
    valueKind: "next_action",
    temporalPolicy: "current_observation",
    findingKind: "next_action_mismatch",
    severity: "medium",
    safeAction: "review_next_action"
  },
  next_action_due_at: {
    valueKind: "datetime",
    temporalPolicy: "current_observation",
    findingKind: "next_action_mismatch",
    severity: "medium",
    safeAction: "review_next_action"
  },
  responsible_profile: {
    valueKind: "profile",
    temporalPolicy: "current_observation",
    findingKind: "responsibility_mismatch",
    severity: "medium",
    safeAction: "review_responsibility"
  },
  approval_state: {
    valueKind: "state",
    temporalPolicy: "current_observation",
    findingKind: "execution_state_mismatch",
    severity: "high",
    safeAction: "review_execution_state"
  },
  document_execution_state: {
    valueKind: "state",
    temporalPolicy: "current_observation",
    findingKind: "execution_state_mismatch",
    severity: "medium",
    safeAction: "review_execution_state"
  },
  communication_state: {
    valueKind: "state",
    temporalPolicy: "current_observation",
    findingKind: "execution_state_mismatch",
    severity: "high",
    safeAction: "review_execution_state"
  }
};

const evidenceStrengthRank: Record<ContextIntegrityEvidenceStrength, number> = {
  insufficient: 0,
  partial: 1,
  explicit: 2,
  structured: 3
};

const severityRank: Record<ContextIntegritySeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  review: 1
};

function boundedText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > CONTEXT_INTEGRITY_LIMITS.textLength) {
    throw new Error(`context_integrity_invalid_${field}`);
  }
  return trimmed;
}

function validCanonicalId(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 256;
}

function validIso(value: string | null): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function visibilityKey(visibility: ContextIntegrityVisibility): string {
  return visibility.scope === "business"
    ? "business"
    : `owner_private:${encodeURIComponent(visibility.ownerProfileId)}`;
}

function sourceKey(observation: ContextIntegrityObservation): string {
  return [
    observation.source.sourceType,
    observation.source.sourceId,
    observation.source.sourceRevision ?? observation.source.evidence.sourceVersion ?? ""
  ].map((part) => encodeURIComponent(part)).join(":");
}

function subjectKey(observation: ContextIntegrityObservation): string {
  return `${observation.subject.type}:${encodeURIComponent(observation.subject.canonicalId ?? "")}`;
}

function normalizeIntegerString(raw: string): string | null {
  if (!/^-?\d{1,30}$/.test(raw)) return null;
  const negative = raw.startsWith("-");
  const digits = (negative ? raw.slice(1) : raw).replace(/^0+(?=\d)/, "");
  return `${negative && digits !== "0" ? "-" : ""}${digits}`;
}

function normalizeCurrency(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : null;
}

function valueKey(value: ContextIntegrityValue): string {
  switch (value.kind) {
    case "identity":
    case "profile":
      return [
        value.kind,
        value.resolution,
        value.canonicalId ?? "",
        boundedText(value.label, "label")
      ].map(encodeURIComponent).join(":");
    case "money":
      return [
        value.kind,
        normalizeIntegerString(value.minorUnits) ?? `invalid:${value.minorUnits}`,
        normalizeCurrency(value.currency) ?? `invalid:${value.currency}`
      ].map(encodeURIComponent).join(":");
    case "currency":
      return `${value.kind}:${encodeURIComponent(normalizeCurrency(value.code) ?? `invalid:${value.code}`)}`;
    case "datetime":
      return `${value.kind}:${encodeURIComponent(value.iso)}`;
    case "state":
      return `${value.kind}:${encodeURIComponent(boundedText(value.value, "state"))}`;
    case "boolean":
      return `${value.kind}:${value.value ? "1" : "0"}`;
    case "next_action":
      return [
        value.kind,
        value.semanticKey ?? "",
        boundedText(value.label, "label")
      ].map(encodeURIComponent).join(":");
    case "text":
      return `${value.kind}:${encodeURIComponent(boundedText(value.value, "text"))}`;
  }
}

function observationSignature(observation: ContextIntegrityObservation): string {
  return [
    observation.businessId,
    visibilityKey(observation.visibility),
    observation.role,
    subjectKey(observation),
    observation.field,
    valueKey(observation.value),
    sourceKey(observation),
    observation.observedAt ?? "",
    observation.temporalState,
    observation.observationTimeBasis,
    observation.provenance,
    observation.evidenceStrength
  ].map(encodeURIComponent).join("|");
}

function assertObservation(observation: ContextIntegrityObservation, businessId: string): void {
  boundedText(observation.id, "observation_id");
  boundedText(observation.businessId, "business_id");
  boundedText(observation.source.sourceId, "source_id");

  if (observation.businessId !== businessId) {
    throw new Error("context_integrity_tenant_scope_forbidden");
  }

  if (
    observation.visibility.scope === "owner_private" &&
    !validCanonicalId(observation.visibility.ownerProfileId)
  ) {
    throw new Error("context_integrity_invalid_private_scope");
  }

  if (observation.source.evidence.sourceId !== observation.source.sourceId) {
    throw new Error("context_integrity_evidence_source_mismatch");
  }

  if (observation.source.evidence.sourceType !== observation.source.sourceType) {
    throw new Error("context_integrity_evidence_type_mismatch");
  }

  valueKey(observation.value);
}

function mergeVisibility(
  left: ContextIntegrityVisibility,
  right: ContextIntegrityVisibility
): ContextIntegrityComparabilityResult {
  if (left.scope === "business" && right.scope === "business") {
    return { comparable: true, visibility: { scope: "business" } };
  }

  if (left.scope === "owner_private" && right.scope === "owner_private") {
    if (left.ownerProfileId !== right.ownerProfileId) {
      return { comparable: false, reason: "privacy_scope_mismatch" };
    }
    return {
      comparable: true,
      visibility: { scope: "owner_private", ownerProfileId: left.ownerProfileId }
    };
  }

  const owner = left.scope === "owner_private" ? left.ownerProfileId : right.scope === "owner_private" ? right.ownerProfileId : null;
  if (!owner) return { comparable: false, reason: "privacy_scope_mismatch" };

  return {
    comparable: true,
    visibility: { scope: "owner_private", ownerProfileId: owner }
  };
}

function evidenceIsSufficient(observation: ContextIntegrityObservation): boolean {
  if (evidenceStrengthRank[observation.evidenceStrength] < evidenceStrengthRank.explicit) return false;
  if (observation.source.evidence.sourceId !== observation.source.sourceId) return false;
  if (observation.source.evidence.sourceType !== observation.source.sourceType) return false;

  const evidenceRevision = observation.source.evidence.sourceVersion;
  const sourceRevision = observation.source.sourceRevision;
  if (evidenceRevision && sourceRevision && evidenceRevision !== sourceRevision) return false;

  return true;
}

function identityResolutionReason(
  value: ContextIntegrityValue
): ContextIntegrityComparabilityReason | null {
  if (value.kind !== "identity" && value.kind !== "profile") return null;
  if (value.resolution === "ambiguous") return "ambiguous_identity";
  if (value.resolution !== "resolved" || !validCanonicalId(value.canonicalId)) return "missing_identity";
  return null;
}

function temporalReason(
  observation: ContextIntegrityObservation
): ContextIntegrityComparabilityReason | null {
  if (observation.temporalState === "historical") return "historical_not_conflicting";
  if (observation.temporalState !== "current") return "missing_observation_time";
  if (!validIso(observation.observedAt)) return "missing_observation_time";
  if (
    observation.observationTimeBasis === "unknown" ||
    observation.observationTimeBasis === "document_modified"
  ) {
    return "missing_observation_time";
  }
  return null;
}

export function compareContextObservations(
  left: ContextIntegrityObservation,
  right: ContextIntegrityObservation
): ContextIntegrityComparabilityResult {
  if (left.businessId !== right.businessId) {
    return { comparable: false, reason: "tenant_scope_mismatch" };
  }

  if (!validCanonicalId(left.subject.canonicalId) || !validCanonicalId(right.subject.canonicalId)) {
    return { comparable: false, reason: "missing_identity" };
  }

  if (
    left.subject.type !== right.subject.type ||
    left.subject.canonicalId !== right.subject.canonicalId
  ) {
    return { comparable: false, reason: "different_subject" };
  }

  if (left.field !== right.field) {
    return { comparable: false, reason: "different_field" };
  }

  const visibility = mergeVisibility(left.visibility, right.visibility);
  if (!visibility.comparable) return visibility;

  if (!evidenceIsSufficient(left) || !evidenceIsSufficient(right)) {
    return {
      comparable: false,
      reason: "insufficient_evidence",
      visibility: visibility.visibility
    };
  }

  const contract = CONTEXT_INTEGRITY_FIELD_REGISTRY[left.field];
  if (
    left.value.kind !== right.value.kind ||
    left.value.kind !== contract.valueKind
  ) {
    return {
      comparable: false,
      reason: "incompatible_type",
      visibility: visibility.visibility
    };
  }

  const leftIdentityReason = identityResolutionReason(left.value);
  if (leftIdentityReason) {
    return {
      comparable: false,
      reason: leftIdentityReason,
      visibility: visibility.visibility
    };
  }

  const rightIdentityReason = identityResolutionReason(right.value);
  if (rightIdentityReason) {
    return {
      comparable: false,
      reason: rightIdentityReason,
      visibility: visibility.visibility
    };
  }

  if (left.value.kind === "money" && right.value.kind === "money") {
    const leftAmount = normalizeIntegerString(left.value.minorUnits);
    const rightAmount = normalizeIntegerString(right.value.minorUnits);
    if (!leftAmount || !rightAmount) {
      return {
        comparable: false,
        reason: "incompatible_type",
        visibility: visibility.visibility
      };
    }

    const leftCurrency = normalizeCurrency(left.value.currency);
    const rightCurrency = normalizeCurrency(right.value.currency);
    if (!leftCurrency || !rightCurrency || leftCurrency !== rightCurrency) {
      return {
        comparable: false,
        reason: "incompatible_currency",
        visibility: visibility.visibility
      };
    }
  }

  if (left.value.kind === "currency" && right.value.kind === "currency") {
    const leftCurrency = normalizeCurrency(left.value.code);
    const rightCurrency = normalizeCurrency(right.value.code);
    if (!leftCurrency || !rightCurrency) {
      return {
        comparable: false,
        reason: "incompatible_currency",
        visibility: visibility.visibility
      };
    }
  }

  if (
    left.value.kind === "next_action" &&
    right.value.kind === "next_action" &&
    (!left.value.semanticKey || !right.value.semanticKey)
  ) {
    return {
      comparable: false,
      reason: "insufficient_evidence",
      visibility: visibility.visibility
    };
  }

  if (left.value.kind === "datetime" && right.value.kind === "datetime") {
    if (!validIso(left.value.iso) || !validIso(right.value.iso)) {
      return {
        comparable: false,
        reason: "incompatible_type",
        visibility: visibility.visibility
      };
    }
  }

  if (contract.temporalPolicy === "current_observation") {
    const leftTemporal = temporalReason(left);
    if (leftTemporal) {
      return {
        comparable: false,
        reason: leftTemporal,
        visibility: visibility.visibility
      };
    }

    const rightTemporal = temporalReason(right);
    if (rightTemporal) {
      return {
        comparable: false,
        reason: rightTemporal,
        visibility: visibility.visibility
      };
    }
  }

  return { comparable: true, visibility: visibility.visibility };
}

export function contextIntegrityValuesEqual(
  left: ContextIntegrityValue,
  right: ContextIntegrityValue
): boolean {
  if (left.kind !== right.kind) return false;

  switch (left.kind) {
    case "identity":
      return right.kind === "identity" &&
        left.resolution === "resolved" &&
        right.resolution === "resolved" &&
        !!left.canonicalId &&
        left.canonicalId === right.canonicalId;
    case "profile":
      return right.kind === "profile" &&
        left.resolution === "resolved" &&
        right.resolution === "resolved" &&
        !!left.canonicalId &&
        left.canonicalId === right.canonicalId;
    case "money":
      return right.kind === "money" &&
        normalizeIntegerString(left.minorUnits) !== null &&
        normalizeIntegerString(left.minorUnits) === normalizeIntegerString(right.minorUnits) &&
        normalizeCurrency(left.currency) !== null &&
        normalizeCurrency(left.currency) === normalizeCurrency(right.currency);
    case "currency":
      return right.kind === "currency" &&
        normalizeCurrency(left.code) !== null &&
        normalizeCurrency(left.code) === normalizeCurrency(right.code);
    case "datetime":
      return right.kind === "datetime" &&
        validIso(left.iso) &&
        validIso(right.iso) &&
        Date.parse(left.iso) === Date.parse(right.iso);
    case "state":
      return right.kind === "state" && left.value === right.value;
    case "boolean":
      return right.kind === "boolean" && left.value === right.value;
    case "next_action":
      return right.kind === "next_action" &&
        !!left.semanticKey &&
        left.semanticKey === right.semanticKey;
    case "text":
      return right.kind === "text" && left.value === right.value;
  }
}

function minimumEvidenceStrength(
  observations: ContextIntegrityObservation[]
): ContextIntegrityEvidenceStrength {
  return observations
    .map((observation) => observation.evidenceStrength)
    .sort((a, b) => evidenceStrengthRank[a] - evidenceStrengthRank[b])[0] ?? "insufficient";
}

function downgradedSeverity(
  base: ContextIntegritySeverity,
  observations: ContextIntegrityObservation[]
): ContextIntegritySeverity {
  if (observations.some((observation) => observation.provenance === "deterministic_derivation")) {
    if (base === "critical" || base === "high") return "medium";
    if (base === "medium") return "review";
  }
  return base;
}

function safeEntityHref(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (!/^\/(?:opportunities|inbox|approvals|outreach|ai|crm)(?:[/?#]|$)/.test(raw)) return undefined;
  if (/[\\\s\u0000-\u001f]/.test(raw)) return undefined;
  return raw;
}

function minimizeEvidence(
  observation: ContextIntegrityObservation
): ContextIntegrityObservation["source"]["evidence"] {
  const evidence = observation.source.evidence;
  return {
    sourceType: evidence.sourceType,
    sourceId: evidence.sourceId,
    title: evidence.title.slice(0, CONTEXT_INTEGRITY_LIMITS.textLength),
    occurredAt: evidence.occurredAt,
    provider: evidence.provider,
    mimeType: evidence.mimeType,
    sourceDocumentId: evidence.sourceDocumentId,
    sourceSegmentId: evidence.sourceSegmentId,
    sourceLocation: evidence.sourceLocation?.slice(0, CONTEXT_INTEGRITY_LIMITS.textLength),
    syncedAt: evidence.syncedAt,
    sourceVersion: evidence.sourceVersion?.slice(0, 128),
    commercialRelationship: evidence.commercialRelationship,
    entityHref: safeEntityHref(evidence.entityHref),
    visibility: "metadata"
  };
}

function evidenceIdentity(evidence: ContextIntegrityObservation["source"]["evidence"]): string {
  return [
    evidence.sourceType,
    evidence.sourceId,
    evidence.sourceSegmentId ?? "",
    evidence.sourceVersion ?? ""
  ].map(encodeURIComponent).join(":");
}

function findingKey(
  businessId: string,
  visibility: ContextIntegrityVisibility,
  kind: ContextIntegrityFindingKind,
  canonical: ContextIntegrityObservation,
  conflicting: ContextIntegrityObservation[]
): string {
  const observations = [canonical, ...conflicting]
    .map((observation) => `${encodeURIComponent(observation.id)}@${sourceKey(observation)}`)
    .sort();

  return [
    CONTEXT_INTEGRITY_CONTRACT_VERSION,
    encodeURIComponent(businessId),
    visibilityKey(visibility),
    kind,
    subjectKey(canonical),
    canonical.field,
    ...observations
  ].join("|");
}

function makeFinding(
  canonical: ContextIntegrityObservation,
  conflicting: ContextIntegrityObservation,
  visibility: ContextIntegrityVisibility
): ContextIntegrityFinding {
  if (!canonical.subject.canonicalId) {
    throw new Error("context_integrity_missing_subject");
  }

  const contract = CONTEXT_INTEGRITY_FIELD_REGISTRY[canonical.field];
  const observations = [canonical, conflicting];
  const evidence = Array.from(
    new Map(
      observations
        .map(minimizeEvidence)
        .map((item) => [evidenceIdentity(item), item] as const)
    ).values()
  ).slice(0, CONTEXT_INTEGRITY_LIMITS.evidencePerFinding);

  return {
    key: findingKey(canonical.businessId, visibility, contract.findingKind, canonical, [conflicting]),
    contractVersion: CONTEXT_INTEGRITY_CONTRACT_VERSION,
    businessId: canonical.businessId,
    visibility,
    kind: contract.findingKind,
    subject: {
      type: canonical.subject.type,
      canonicalId: canonical.subject.canonicalId
    },
    field: canonical.field,
    severity: downgradedSeverity(contract.severity, observations),
    evidenceStrength: minimumEvidenceStrength(observations),
    state: "needs_review",
    reasonCode: "different_value_same_comparable_context",
    canonicalObservationId: canonical.id,
    conflictingObservationIds: [conflicting.id],
    evidence,
    safeAction: contract.safeAction
  };
}

function groupKey(observation: ContextIntegrityObservation): string {
  return [subjectKey(observation), observation.field].join("|");
}

function normalizeCoverage(
  coverage: ContextIntegrityCoverage,
  limitations: string[]
): ContextIntegrityEvaluation["coverage"] {
  const evaluatedSourceCount = Number.isInteger(coverage.evaluatedSourceCount) && coverage.evaluatedSourceCount >= 0
    ? coverage.evaluatedSourceCount
    : 0;
  const expectedSourceCount = Number.isInteger(coverage.expectedSourceCount) && (coverage.expectedSourceCount ?? 0) >= 0
    ? coverage.expectedSourceCount ?? null
    : null;

  let status = coverage.status;
  if (
    status === "complete" &&
    expectedSourceCount !== null &&
    evaluatedSourceCount < expectedSourceCount
  ) {
    status = "partial";
    limitations.push("expected_sources_not_fully_evaluated");
  }

  if (limitations.length && status === "complete") status = "partial";

  return {
    status,
    evaluatedSourceCount,
    expectedSourceCount,
    limitations: Array.from(
      new Set(
        [...(coverage.limitations ?? []), ...limitations]
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ).slice(0, CONTEXT_INTEGRITY_LIMITS.limitations)
  };
}

export function evaluateContextIntegrity(input: {
  businessId: string;
  observations: ContextIntegrityObservation[];
  coverage: ContextIntegrityCoverage;
}): ContextIntegrityEvaluation {
  boundedText(input.businessId, "business_id");

  const deduplicated = new Map<string, ContextIntegrityObservation>();
  let duplicateObservationCount = 0;

  for (const observation of input.observations) {
    assertObservation(observation, input.businessId);
    const existing = deduplicated.get(observation.id);
    if (!existing) {
      deduplicated.set(observation.id, observation);
      continue;
    }

    if (observationSignature(existing) !== observationSignature(observation)) {
      throw new Error("context_integrity_duplicate_observation_conflict");
    }
    duplicateObservationCount += 1;
  }

  const ordered = Array.from(deduplicated.values()).sort((a, b) => a.id.localeCompare(b.id));
  const truncatedObservationCount = Math.max(0, ordered.length - CONTEXT_INTEGRITY_LIMITS.observations);
  const selected = ordered.slice(0, CONTEXT_INTEGRITY_LIMITS.observations);
  const limitations: string[] = [];

  if (truncatedObservationCount > 0) {
    limitations.push("observation_limit_reached");
  }

  const groups = new Map<string, ContextIntegrityObservation[]>();
  for (const observation of selected) {
    const key = groupKey(observation);
    const values = groups.get(key) ?? [];
    values.push(observation);
    groups.set(key, values);
  }

  const findingMap = new Map<string, ContextIntegrityFinding>();
  const nonComparable: Partial<Record<ContextIntegrityComparabilityReason, number>> = {};

  for (const observations of Array.from(groups.values())) {
    const orderedGroup = [...observations].sort((a, b) => {
      const role = (a.role === "canonical" ? 0 : 1) - (b.role === "canonical" ? 0 : 1);
      return role || a.id.localeCompare(b.id);
    });

    if (orderedGroup.length > CONTEXT_INTEGRITY_LIMITS.observationsPerFieldGroup) {
      limitations.push("field_group_limit_reached");
    }

    const group = orderedGroup.slice(0, CONTEXT_INTEGRITY_LIMITS.observationsPerFieldGroup);
    const canonical = group.filter((observation) => observation.role === "canonical");
    const evidence = group.filter((observation) => observation.role === "evidence");

    for (const current of canonical) {
      for (const candidate of evidence) {
        const comparison = compareContextObservations(current, candidate);

        if (!comparison.comparable) {
          nonComparable[comparison.reason] = (nonComparable[comparison.reason] ?? 0) + 1;
          continue;
        }

        if (contextIntegrityValuesEqual(current.value, candidate.value)) continue;

        const finding = makeFinding(current, candidate, comparison.visibility);
        if (!findingMap.has(finding.key)) findingMap.set(finding.key, finding);
      }
    }
  }

  let findings = Array.from(findingMap.values()).sort((a, b) =>
    severityRank[b.severity] - severityRank[a.severity] ||
    a.kind.localeCompare(b.kind) ||
    a.key.localeCompare(b.key)
  );

  if (findings.length > CONTEXT_INTEGRITY_LIMITS.findings) {
    findings = findings.slice(0, CONTEXT_INTEGRITY_LIMITS.findings);
    limitations.push("finding_limit_reached");
  }

  const coverage = normalizeCoverage(input.coverage, limitations);
  const status = findings.length > 0
    ? "needs_review"
    : coverage.status === "complete"
      ? "clear"
      : "insufficient";

  return {
    contractVersion: CONTEXT_INTEGRITY_CONTRACT_VERSION,
    businessId: input.businessId,
    status,
    findings,
    coverage,
    diagnostics: {
      inputObservationCount: input.observations.length,
      evaluatedObservationCount: selected.length,
      duplicateObservationCount,
      truncatedObservationCount,
      nonComparable
    }
  };
}
