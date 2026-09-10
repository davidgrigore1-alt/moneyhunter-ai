# ReveNew Context Integrity — CI-0 Contract Freeze

Status: **CI-0 / pure deterministic core**

This gate defines the reusable Context Integrity contract before persistence, UI, background evaluation, or model assistance.

## Product question

Context Integrity answers:

> Does the commercial context we are about to trust actually belong together?

It does not decide which source is automatically correct. It determines whether authorized observations are sufficiently comparable and, when they materially disagree, emits a structured human-review finding with inspectable evidence.

## Architecture

`Source → Typed observation → Comparability → Deterministic finding → Evidence → Human review`

CI-0 deliberately stops before persistence and human-resolution mutations.

The existing ReveNew `EvidenceReference` contract is reused. Findings keep only metadata-safe evidence projections; authorized source excerpts are not copied into finding metadata.

## Truth boundaries frozen in CI-0

1. Fact, comparison, finding, and human decision are separate layers.
2. A finding cannot be created by an LLM.
3. Company/title similarity never establishes identity.
4. Identity comparison requires canonical IDs resolved by an authorized upstream loader.
5. Different currencies are not contradictory.
6. Monetary equality uses exact integer minor-unit strings, not floating point.
7. Fields must be the same comparable field. `estimated_value` is not `offer_value`.
8. Current temporal conflicts require a real observation time and a trusted time basis.
9. A document `modifiedAt` timestamp alone is not enough to establish statement observation time.
10. Historical observations do not become current contradictions.
11. Newer evidence does not automatically become authoritative.
12. Next-action prose is not compared lexically. A stable semantic key is required.
13. Private visibility can only stay the same or become narrower.
14. Business + owner-private evidence produces an owner-private finding.
15. Different owner-private scopes do not merge.
16. A different tenant is rejected before evaluation.
17. Source text is data. It cannot pick tenant, identity, severity, or action.
18. Finding severity is deterministic and distinct from evidence strength.
19. Finding identity is stable and independent of clock time, model output, or UI ordering.
20. Partial/unavailable coverage cannot produce a false all-clear.

## Initial field registry

Identity / association:
- `customer_identity`
- `company_identity`
- `contact_company_identity`
- `opportunity_company_identity`
- `source_association`

Commercial:
- `estimated_value`
- `offer_value`
- `contract_value`
- `currency`

Execution:
- `opportunity_stage`
- `next_action`
- `next_action_due_at`
- `responsible_profile`
- `approval_state`
- `document_execution_state`
- `communication_state`

No other field is comparable in CI-0.

## Visibility lattice

- business + business → business
- business + owner_private → owner_private
- owner_private(A) + owner_private(A) → owner_private(A)
- owner_private(A) + owner_private(B) → not comparable
- different tenant → rejected

This is intentionally non-broadening.

## Temporal model

Every observation separates:
- `observedAt`
- `temporalState`: current / historical / unknown
- `observationTimeBasis`

Trusted current conflict bases:
- `record_state`
- `source_declared`
- `source_event`

Not sufficient on their own:
- `document_modified`
- `unknown`

Association integrity is structural and can still require review without using document modification time as proof of a current commercial value.

## Coverage model

Evaluation status is one of:
- `clear`
- `needs_review`
- `insufficient`

`clear` is possible only when supplied coverage is `complete` and the engine did not have to truncate observations/groups/findings.

When expected source count exceeds evaluated source count, coverage is automatically downgraded to partial.

## Stable finding identity

The key includes:
- contract version
- tenant
- visibility scope
- finding kind
- canonical subject
- field
- stable observation/source identities
- source revision/version when supplied

It excludes:
- current time
- generated prose
- model output
- UI order
- random UUIDs

A material source revision can therefore create a new issue identity while unchanged evidence remains idempotent.

## Golden case

Current CRM context:
- opportunity: `Program servicii corporate · Nova Medical`
- canonical customer identity: `Nova Medical`

Authorized Drive evidence:
- selected document explicitly declares `Client: Vector Industrial`
- the upstream resolver uniquely resolves that declaration to the authorized `Vector Industrial` company record

Both observations share:
- same tenant
- same opportunity subject
- same `customer_identity` field
- valid evidence provenance

Their canonical customer IDs differ.

CI-0 result:
- `source_association_mismatch`
- severity `high`
- state `needs_review`
- safe action `review_association`
- exact evidence references retained as metadata
- no relink
- no CRM mutation
- no external action

If the source declaration cannot be uniquely resolved, the pair is not comparable and no hard mismatch is emitted.

## Relationship to existing P4 / Commercial Truth

CI-0 is the general deterministic contract intended to replace ad-hoc pairwise disagreement checks as ReveNew moves to Operational Intelligence V2.

Existing `commercial-truth.ts` and P4/P4.1 remain unchanged in this gate so the validated product behavior cannot regress while the generic contract is red-teamed.

CI-1 should adapt the existing Commercial Truth / Drive evidence loaders to produce these observations and should remove duplicated mismatch logic only after parity tests prove the migration.

CI-0 is therefore **not wired as a second runtime truth engine**. It has no retrieval, persistence, provider, UI, or external-action path.

## Bounds

- max observations: 96
- max observations per subject+field group: 12
- max evidence references per finding: 6
- max findings: 32
- max limitations: 12

When an evaluation hits a bound, coverage is downgraded and cannot produce a false clear result.

## CI-1 entry criteria

CI-1 may start only after:
- CI-0 red-team tests are green;
- full repository validation remains green;
- the golden Nova Medical / Vector Industrial fixture passes;
- no existing runtime behavior was altered by CI-0.

CI-1 scope should be one vertical slice only:

`authorized Drive evidence + canonical CRM context → ContextObservation adapters → Context Integrity finding → existing evidence route`

Persistence and resolution auditing remain separate later gates.
