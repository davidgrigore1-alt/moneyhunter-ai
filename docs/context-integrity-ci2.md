# Context Integrity CI-2.0 — Persistent Finding Contract & Database Model

## Product objective

CI-2 turns a transient contradiction into a durable commercial review case.

The user should no longer experience Context Integrity as:
"ReveNew noticed something right now."

The target experience is:
"ReveNew noticed a concrete execution risk, keeps it visible until a human
reviews it, preserves the decision, and reopens the case if the evidence changes."

## CI-2.0 scope

This phase intentionally implements the durable contract before any decision UI:

- stable `caseKey` for one logical issue family;
- immutable `findingKey` fingerprint for the exact evaluated snapshot;
- persistence schema for current finding state;
- append-only audit event schema at application privilege level;
- row version for stale-decision protection;
- metadata-only evidence snapshot;
- fail-closed reconciliation plan;
- no automatic resolution from partial coverage;
- no direct authenticated write access;
- no autonomous CRM/document mutation.

## Two keys, two different jobs

`findingKey`
- comes from CI-0;
- represents the exact finding snapshot;
- may change when evidence/source revision changes.

`caseKey`
- comes from CI-2 lifecycle;
- groups the same logical issue across source revisions;
- excludes source revisions and evidence labels;
- includes tenant, visibility, subject, field, kind and source identities.

That separation makes it possible to keep one human review case without
mistaking changed evidence for the exact same finding.

## State model

Current persistent states:

- `needs_review`
- `resolved`
- `dismissed`
- `superseded`
- `open` remains reserved by the existing contract

CI-2.0 does not expose a human resolution RPC yet.

## Reconciliation rules

1. new case -> create / needs_review
2. same case + same findingKey -> observe, preserve human state
3. same case + changed findingKey + pending -> refresh
4. same case + changed findingKey + resolved/dismissed/superseded -> reopen
5. missing pending case + complete coverage -> supersede
6. missing pending case + partial/insufficient/unavailable coverage -> hold

This prevents false "problem solved" behavior when ReveNew simply failed to
evaluate all sources.

## Data minimization

Persisted evidence contains metadata references only:
source type/id/revision, document/segment ids, title/location, observed time,
provider.

Authorized content excerpts and source bodies are not persisted in the
finding lifecycle tables.

## Next phase

CI-2.1 will add:
- atomic detection reconciliation RPC;
- atomic human resolution RPC with compare-and-set row version + finding key;
- server repository;
- resolution UI on the Context Integrity surface;
- exact audit trail;
- golden-case re-evaluation.
