# Context Integrity CI-2.1 — Atomic Reconciliation Runtime

CI-2.0 defined durable finding state. CI-2.1 makes detection persistence real.

## User value

A commercial issue is no longer a transient Ask result. When the deterministic
engine finds it, ReveNew can keep one durable review case across repeated reads.

The core invariant is:

same logical issue -> one case
same exact finding -> observe without invalidating a reviewer
changed evidence -> increment version / reopen when appropriate
missing finding + incomplete coverage -> never claim resolution
missing finding + complete coverage -> supersede current pending case

## Atomicity

`reconcile_context_integrity_v1` reconciles the complete opportunity-scoped
finding set in one PostgreSQL RPC transaction.

It is executable only by `service_role`.

Authenticated users keep read-only access to the persistence tables. Human
resolution will use a separate compare-and-set RPC in CI-2.2.

## No hidden autonomous action

Reconciliation writes only Context Integrity finding state and audit events.

It does not:
- relink a document;
- change opportunity.organization_id;
- modify CRM companies or contacts;
- send email;
- write to Google providers;
- decide which source is true.

## Evidence minimization

The repository sends only the metadata-only evidence snapshot created by CI-2.0.
The RPC allowlists the accepted evidence keys. Source body/excerpt fields are
rejected rather than stored.

## Important lifecycle correction

A superseded finding that reappears must become `needs_review` again even when
its exact `findingKey` is unchanged. A human `resolved` or `dismissed` decision,
however, remains preserved for an identical snapshot until the evidence changes.

## Next phase

CI-2.2 will add the human resolution loop:

- authenticated compare-and-set resolution RPC;
- actor + timestamp + reason + optional note;
- stale `row_version` / `finding_key` rejection;
- re-evaluation immediately before resolution;
- compact resolution controls inside the existing Context Integrity surface.
