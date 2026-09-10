# ReveNew Context Integrity — CI-1 Real CRM + Drive Vertical Slice

CI-1 wires the CI-0 deterministic contract into the existing Commercial Truth runtime for one narrow path:

`canonical CRM opportunity/company + authorized Google Drive segments → typed ContextObservation → Context Integrity → existing Commercial Truth / Evidence UI`

## Identity authority

The opportunity's persisted `organization_id` is canonical. An external `Client:`, `Beneficiar:` or `Customer:` declaration is only resolvable through `crm_organizations.normalized_name` inside the same `business_id`.

The normalization is intentionally the same conservative CRM identity normalization already used by ReveNew: NFD, remove combining marks, lowercase, collapse whitespace, trim. There is no fuzzy matching, embedding, email-domain inference, legal-suffix stripping, model call, or title similarity.

The database already enforces `(business_id, normalized_name)` uniqueness. CI-1 still fails closed if its bounded input contains ambiguous identities.

## Source extraction

Only a complete line beginning with one of these fields is eligible:
- `Client:`
- `Beneficiar:`
- `Customer:`

A prose mention, disclaimer, quoted line, or prompt-like instruction is not a customer identity field. If one Drive source declares multiple distinct customer identities, the source is ambiguous and no hard mismatch is emitted.

## Golden case

Workspace: Meridian Commercial Operations.

Current persisted opportunity company: Nova Medical.

Selected synced Drive document: explicit `Client: Vector Industrial`.

If both CRM identities resolve uniquely in the same tenant, CI-1 emits:
- `source_association_mismatch`
- severity `high`
- `review_association`
- exact Drive EvidenceReference source/segment/location
- business visibility
- no relink
- no CRM mutation
- no provider write

## Commercial Truth convergence

CI-1 removes the previous ad-hoc customer-name difference check from `commercial-truth.ts`. Commercial Truth projects the Context Integrity finding into its existing `TruthIssue` UX and records `origin: "context_integrity"` plus the stable finding key.

This is incremental convergence, not a parallel truth engine.

The older same-currency CRM estimate versus explicit offer-value review remains outside the CI-1 migration. However, cross-currency values are no longer labeled as a value discrepancy: EUR and RON are non-comparable without an explicit FX operation.

## Coverage

Drive source and segment caps are reflected in Context Integrity coverage. Truncation or an unavailable identity lookup cannot produce a false `clear`.

## Persistence boundary

CI-1 is read-time evaluation only. It creates no new table, migration, background job, finding history, or resolution mutation.

CI-2 is reserved for persistent finding lifecycle + explicit human resolution audit after CI-1 is fully green.
