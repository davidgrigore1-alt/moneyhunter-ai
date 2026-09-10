import { metadataEvidence, type EvidenceReference } from "@/lib/evidence-reference";
import { evaluateContextIntegrity } from "./core";
import type {
  ContextIntegrityCoverage,
  ContextIntegrityEvaluation,
  ContextIntegrityObservation
} from "./types";

export const CONTEXT_INTEGRITY_ADAPTER_LIMITS = {
  customerDeclarations: 12,
  candidateCompanies: 36,
  lineCharacters: 220,
  identityCharacters: 120,
  aliasMinTokens: 2,
  aliasMinCharacters: 8,
  aliasMaxTrailingTokens: 2
} as const;

const CONTEXT_IDENTITY_LEGAL_SUFFIXES = new Set([
  "srl",
  "sa",
  "sasu",
  "sas",
  "llc",
  "ltd",
  "limited",
  "inc",
  "incorporated",
  "gmbh",
  "ag",
  "bv",
  "plc"
]);

export type ContextIntegrityCompanyIdentity = {
  businessId: string;
  id: string;
  name: string;
  normalizedName?: string | null;
};

export type ContextIntegrityDriveSegment = {
  businessId: string;
  opportunityId: string;
  sourceId: string;
  segmentId: string;
  title: string;
  kind: string;
  text: string;
  location: string;
  modifiedAt: string | null;
  syncedAt: string | null;
  originalHref?: string;
  mime: string;
  sourceVersion?: string | null;
};

export type ContextCustomerIdentityDeclaration = {
  sourceId: string;
  segmentId: string;
  label: string;
  normalizedLabel: string;
  evidence: EvidenceReference;
  resolution: "resolved" | "ambiguous" | "unresolved";
  canonicalId: string | null;
};

export type OpportunityContextIntegrityResult = {
  evaluation: ContextIntegrityEvaluation;
  declarations: ContextCustomerIdentityDeclaration[];
};

export function normalizeContextIdentity(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stableShortHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function isValidId(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 256;
}

function sourceEvidence(segment: ContextIntegrityDriveSegment): EvidenceReference {
  return metadataEvidence({
    sourceType: "document",
    sourceId: segment.sourceId,
    sourceDocumentId: segment.sourceId,
    sourceSegmentId: segment.segmentId,
    title: segment.title,
    mimeType: segment.mime,
    sourceLocation: segment.location,
    occurredAt: segment.modifiedAt,
    syncedAt: segment.syncedAt,
    provider: "google_drive",
    sourceVersion: segment.sourceVersion ?? undefined,
    entityHref: `/opportunities/${segment.opportunityId}/sources/${segment.sourceId}#segment-${segment.segmentId}`,
    originalHref: segment.originalHref,
    commercialRelationship: segment.opportunityId
  });
}

export function extractContextCustomerIdentityDeclarations(
  segments: ContextIntegrityDriveSegment[]
): Array<Omit<ContextCustomerIdentityDeclaration, "resolution" | "canonicalId">> {
  const declarations: Array<Omit<ContextCustomerIdentityDeclaration, "resolution" | "canonicalId">> = [];
  const ordered = [...segments].sort(
    (left, right) =>
      left.sourceId.localeCompare(right.sourceId) ||
      left.segmentId.localeCompare(right.segmentId)
  );

  for (const segment of ordered) {
    if (declarations.length >= CONTEXT_INTEGRITY_ADAPTER_LIMITS.customerDeclarations) break;

    for (const rawLine of segment.text.split(/\r?\n/)) {
      if (declarations.length >= CONTEXT_INTEGRITY_ADAPTER_LIMITS.customerDeclarations) break;
      if (rawLine.length > CONTEXT_INTEGRITY_ADAPTER_LIMITS.lineCharacters) continue;

      const line = rawLine.trim();
      const match = line.match(/^(?:client|beneficiar|customer)\s*:\s*(\S(?:.*\S)?)\s*$/i);
      if (!match) continue;

      const label = match[1].trim();
      if (!label || label.length > CONTEXT_INTEGRITY_ADAPTER_LIMITS.identityCharacters) continue;

      declarations.push({
        sourceId: segment.sourceId,
        segmentId: segment.segmentId,
        label,
        normalizedLabel: normalizeContextIdentity(label),
        evidence: sourceEvidence(segment)
      });
    }
  }

  return declarations;
}

export function collectContextCustomerIdentityKeys(
  segments: ContextIntegrityDriveSegment[]
): string[] {
  return Array.from(
    new Set(
      extractContextCustomerIdentityDeclarations(segments)
        .map((item) => item.normalizedLabel)
        .filter(Boolean)
    )
  ).slice(0, CONTEXT_INTEGRITY_ADAPTER_LIMITS.customerDeclarations);
}

function companyIdentityKey(company: ContextIntegrityCompanyIdentity): string {
  return company.normalizedName?.trim() || normalizeContextIdentity(company.name);
}

function identityTokens(value: string): string[] {
  return normalizeContextIdentity(value).split(" ").filter(Boolean);
}

/**
 * Deterministic legal-name alias only:
 * - exact whole-token prefix;
 * - at least two declared tokens / eight characters;
 * - at most two trailing CRM tokens;
 * - CRM canonical name must end in a known legal suffix.
 *
 * This is intentionally not fuzzy matching: no substring search, edit distance,
 * embeddings, LLM inference, or "newer source wins" behavior.
 */
export function isDeterministicContextIdentityAlias(
  declarationKey: string,
  companyKey: string
): boolean {
  const declared = identityTokens(declarationKey);
  const canonical = identityTokens(companyKey);

  if (
    declared.length < CONTEXT_INTEGRITY_ADAPTER_LIMITS.aliasMinTokens ||
    normalizeContextIdentity(declarationKey).length <
      CONTEXT_INTEGRITY_ADAPTER_LIMITS.aliasMinCharacters ||
    canonical.length <= declared.length ||
    canonical.length - declared.length >
      CONTEXT_INTEGRITY_ADAPTER_LIMITS.aliasMaxTrailingTokens ||
    !CONTEXT_IDENTITY_LEGAL_SUFFIXES.has(canonical[canonical.length - 1])
  ) {
    return false;
  }

  return declared.every((token, index) => canonical[index] === token);
}

function normalizeCoverage(
  coverage: ContextIntegrityCoverage,
  directoryComplete: boolean
): ContextIntegrityCoverage {
  if (directoryComplete) return coverage;

  return {
    status: coverage.status === "complete" ? "partial" : coverage.status,
    evaluatedSourceCount: coverage.evaluatedSourceCount,
    expectedSourceCount: coverage.expectedSourceCount,
    limitations: Array.from(
      new Set([...(coverage.limitations ?? []), "company_identity_directory_incomplete"])
    )
  };
}

export function buildOpportunityContextIntegrity(input: {
  businessId: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityObservedAt: string | null;
  organizationId: string | null | undefined;
  companyName: string | null | undefined;
  segments: ContextIntegrityDriveSegment[];
  companies?: ContextIntegrityCompanyIdentity[];
  directoryComplete?: boolean;
  coverage: ContextIntegrityCoverage;
}): OpportunityContextIntegrityResult {
  if (!isValidId(input.businessId) || !isValidId(input.opportunityId)) {
    throw new Error("context_integrity_adapter_scope_invalid");
  }

  const segments = input.segments.filter(
    (segment) =>
      segment.businessId === input.businessId &&
      segment.opportunityId === input.opportunityId
  );

  const extracted = extractContextCustomerIdentityDeclarations(segments);
  const currentCompany =
    isValidId(input.organizationId) && input.companyName?.trim()
      ? {
          businessId: input.businessId,
          id: input.organizationId,
          name: input.companyName.trim(),
          normalizedName: normalizeContextIdentity(input.companyName)
        }
      : null;

  const directory = new Map<string, ContextIntegrityCompanyIdentity>();
  for (const company of [currentCompany, ...(input.companies ?? [])]) {
    if (
      !company ||
      company.businessId !== input.businessId ||
      !isValidId(company.id) ||
      !company.name.trim()
    ) {
      continue;
    }

    directory.set(company.id, {
      businessId: input.businessId,
      id: company.id,
      name: company.name.trim(),
      normalizedName: companyIdentityKey(company)
    });

    if (directory.size >= CONTEXT_INTEGRITY_ADAPTER_LIMITS.candidateCompanies) break;
  }

  const companies = Array.from(directory.values());
  const currentKey = currentCompany ? companyIdentityKey(currentCompany) : null;
  const directoryComplete = input.directoryComplete !== false;

  const labelsPerSource = new Map<string, Set<string>>();
  for (const declaration of extracted) {
    const values = labelsPerSource.get(declaration.sourceId) ?? new Set<string>();
    values.add(declaration.normalizedLabel);
    labelsPerSource.set(declaration.sourceId, values);
  }

  const declarations: ContextCustomerIdentityDeclaration[] = extracted.map((declaration) => {
    const sourceLabels = labelsPerSource.get(declaration.sourceId);

    if (sourceLabels && sourceLabels.size > 1) {
      return { ...declaration, resolution: "ambiguous", canonicalId: null };
    }

    if (currentCompany && currentKey === declaration.normalizedLabel) {
      return {
        ...declaration,
        resolution: "resolved",
        canonicalId: currentCompany.id
      };
    }

    const exactMatches = companies.filter(
      (company) => companyIdentityKey(company) === declaration.normalizedLabel
    );

    if (exactMatches.length === 1) {
      return {
        ...declaration,
        resolution: "resolved",
        canonicalId: exactMatches[0].id
      };
    }

    if (exactMatches.length > 1) {
      return { ...declaration, resolution: "ambiguous", canonicalId: null };
    }

    // Alias resolution needs a complete bounded tenant directory so that a
    // seemingly unique prefix can never become a false hard contradiction.
    if (!directoryComplete) {
      return { ...declaration, resolution: "unresolved", canonicalId: null };
    }

    const aliasMatches = companies.filter((company) =>
      isDeterministicContextIdentityAlias(
        declaration.normalizedLabel,
        companyIdentityKey(company)
      )
    );

    if (aliasMatches.length === 1) {
      return {
        ...declaration,
        resolution: "resolved",
        canonicalId: aliasMatches[0].id
      };
    }

    return {
      ...declaration,
      resolution: aliasMatches.length > 1 ? "ambiguous" : "unresolved",
      canonicalId: null
    };
  });

  const observations: ContextIntegrityObservation[] = [];

  if (currentCompany) {
    observations.push({
      id: `ci:crm:${input.opportunityId}:customer_identity`,
      businessId: input.businessId,
      visibility: { scope: "business" },
      role: "canonical",
      subject: { type: "opportunity", canonicalId: input.opportunityId },
      field: "customer_identity",
      value: {
        kind: "identity",
        canonicalId: currentCompany.id,
        label: currentCompany.name,
        resolution: "resolved"
      },
      source: {
        sourceType: "opportunity",
        sourceId: input.opportunityId,
        sourceRevision: null,
        evidence: metadataEvidence({
          sourceType: "opportunity",
          sourceId: input.opportunityId,
          title: input.opportunityTitle,
          occurredAt: input.opportunityObservedAt,
          entityHref: `/opportunities/${input.opportunityId}`,
          commercialRelationship: input.opportunityId
        })
      },
      observedAt: input.opportunityObservedAt,
      temporalState: "current",
      observationTimeBasis: "record_state",
      provenance: "structured_record",
      evidenceStrength: "structured"
    });
  }

  for (const declaration of declarations) {
    observations.push({
      id: [
        "ci:drive",
        declaration.sourceId,
        declaration.segmentId,
        "customer_identity",
        stableShortHash(declaration.normalizedLabel)
      ].join(":"),
      businessId: input.businessId,
      visibility: { scope: "business" },
      role: "evidence",
      subject: { type: "opportunity", canonicalId: input.opportunityId },
      field: "customer_identity",
      value: {
        kind: "identity",
        canonicalId: declaration.canonicalId,
        label: declaration.label,
        resolution: declaration.resolution
      },
      source: {
        sourceType: declaration.evidence.sourceType,
        sourceId: declaration.evidence.sourceId,
        sourceRevision: declaration.evidence.sourceVersion ?? null,
        evidence: declaration.evidence
      },
      observedAt: declaration.evidence.occurredAt,
      temporalState: "current",
      observationTimeBasis: "document_modified",
      provenance: "explicit_source",
      evidenceStrength: "explicit"
    });
  }

  let coverage = normalizeCoverage(input.coverage, directoryComplete);

  if (!currentCompany) {
    coverage = {
      status: "insufficient",
      evaluatedSourceCount: coverage.evaluatedSourceCount,
      expectedSourceCount: coverage.expectedSourceCount,
      limitations: Array.from(
        new Set([...(coverage.limitations ?? []), "canonical_company_identity_unavailable"])
      )
    };
  }

  return {
    declarations,
    evaluation: evaluateContextIntegrity({
      businessId: input.businessId,
      observations,
      coverage
    })
  };
}
