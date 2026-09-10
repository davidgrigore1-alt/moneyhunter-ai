import type { EvidenceReference } from "@/lib/evidence-reference";

export const CONTEXT_INTEGRITY_CONTRACT_VERSION = "context-integrity/0" as const;

export type ContextIntegritySubjectType =
  | "company"
  | "contact"
  | "opportunity"
  | "document"
  | "communication"
  | "workflow";

export type ContextIntegrityField =
  | "customer_identity"
  | "company_identity"
  | "contact_company_identity"
  | "opportunity_company_identity"
  | "source_association"
  | "estimated_value"
  | "offer_value"
  | "contract_value"
  | "currency"
  | "opportunity_stage"
  | "next_action"
  | "next_action_due_at"
  | "responsible_profile"
  | "approval_state"
  | "document_execution_state"
  | "communication_state";

export type ContextIntegrityVisibility =
  | { scope: "business" }
  | { scope: "owner_private"; ownerProfileId: string };

export type ContextIntegrityEvidenceStrength =
  | "explicit"
  | "structured"
  | "partial"
  | "insufficient";

export type ContextIntegrityProvenance =
  | "explicit_source"
  | "structured_record"
  | "deterministic_derivation";

export type ContextIntegrityTemporalState =
  | "current"
  | "historical"
  | "unknown";

export type ContextIntegrityObservationTimeBasis =
  | "record_state"
  | "source_declared"
  | "source_event"
  | "document_modified"
  | "unknown";

export type ContextIntegrityObservationRole = "canonical" | "evidence";

export type ContextIntegrityValue =
  | {
      kind: "identity";
      canonicalId: string | null;
      label: string;
      resolution: "resolved" | "ambiguous" | "unresolved";
    }
  | {
      kind: "money";
      minorUnits: string;
      currency: string;
    }
  | {
      kind: "currency";
      code: string;
    }
  | {
      kind: "datetime";
      iso: string;
    }
  | {
      kind: "state";
      value: string;
    }
  | {
      kind: "profile";
      canonicalId: string | null;
      label: string;
      resolution: "resolved" | "ambiguous" | "unresolved";
    }
  | {
      kind: "boolean";
      value: boolean;
    }
  | {
      kind: "next_action";
      semanticKey: string | null;
      label: string;
    }
  | {
      kind: "text";
      value: string;
    };

export type ContextIntegrityObservation = {
  id: string;
  businessId: string;
  visibility: ContextIntegrityVisibility;
  role: ContextIntegrityObservationRole;
  subject: {
    type: ContextIntegritySubjectType;
    canonicalId: string | null;
  };
  field: ContextIntegrityField;
  value: ContextIntegrityValue;
  source: {
    sourceType: EvidenceReference["sourceType"];
    sourceId: string;
    sourceRevision?: string | null;
    evidence: EvidenceReference;
  };
  observedAt: string | null;
  temporalState: ContextIntegrityTemporalState;
  observationTimeBasis: ContextIntegrityObservationTimeBasis;
  extractedAt?: string | null;
  provenance: ContextIntegrityProvenance;
  evidenceStrength: ContextIntegrityEvidenceStrength;
};

export type ContextIntegrityComparabilityReason =
  | "different_subject"
  | "different_field"
  | "incompatible_type"
  | "incompatible_currency"
  | "missing_identity"
  | "ambiguous_identity"
  | "missing_observation_time"
  | "historical_not_conflicting"
  | "insufficient_evidence"
  | "privacy_scope_mismatch"
  | "tenant_scope_mismatch";

export type ContextIntegrityComparabilityResult =
  | {
      comparable: true;
      visibility: ContextIntegrityVisibility;
    }
  | {
      comparable: false;
      reason: ContextIntegrityComparabilityReason;
      visibility?: ContextIntegrityVisibility;
    };

export type ContextIntegrityFindingKind =
  | "entity_context_mismatch"
  | "source_association_mismatch"
  | "commercial_value_mismatch"
  | "next_action_mismatch"
  | "responsibility_mismatch"
  | "execution_state_mismatch"
  | "insufficient_context_integrity";

export type ContextIntegritySeverity = "critical" | "high" | "medium" | "review";

export type ContextIntegrityFindingState =
  | "open"
  | "needs_review"
  | "resolved"
  | "dismissed"
  | "superseded";

export type ContextIntegrityResolutionReason =
  | "kept_current_context"
  | "source_relinked"
  | "current_value_confirmed"
  | "observation_marked_historical"
  | "dismissed_with_reason"
  | "source_changed";

export type ContextIntegritySafeAction =
  | "review_association"
  | "review_value"
  | "review_next_action"
  | "review_responsibility"
  | "review_execution_state";

export type ContextIntegrityFinding = {
  key: string;
  contractVersion: typeof CONTEXT_INTEGRITY_CONTRACT_VERSION;
  businessId: string;
  visibility: ContextIntegrityVisibility;
  kind: ContextIntegrityFindingKind;
  subject: {
    type: ContextIntegritySubjectType;
    canonicalId: string;
  };
  field: ContextIntegrityField;
  severity: ContextIntegritySeverity;
  evidenceStrength: ContextIntegrityEvidenceStrength;
  state: "needs_review";
  reasonCode: "different_value_same_comparable_context";
  canonicalObservationId: string;
  conflictingObservationIds: string[];
  evidence: EvidenceReference[];
  safeAction: ContextIntegritySafeAction;
};

export type ContextIntegrityCoverageStatus =
  | "complete"
  | "partial"
  | "insufficient"
  | "unavailable";

export type ContextIntegrityCoverage = {
  status: ContextIntegrityCoverageStatus;
  evaluatedSourceCount: number;
  expectedSourceCount?: number | null;
  limitations?: string[];
};

export type ContextIntegrityEvaluationStatus =
  | "clear"
  | "needs_review"
  | "insufficient";

export type ContextIntegrityEvaluation = {
  contractVersion: typeof CONTEXT_INTEGRITY_CONTRACT_VERSION;
  businessId: string;
  status: ContextIntegrityEvaluationStatus;
  findings: ContextIntegrityFinding[];
  coverage: {
    status: ContextIntegrityCoverageStatus;
    evaluatedSourceCount: number;
    expectedSourceCount: number | null;
    limitations: string[];
  };
  diagnostics: {
    inputObservationCount: number;
    evaluatedObservationCount: number;
    duplicateObservationCount: number;
    truncatedObservationCount: number;
    nonComparable: Partial<Record<ContextIntegrityComparabilityReason, number>>;
  };
};
