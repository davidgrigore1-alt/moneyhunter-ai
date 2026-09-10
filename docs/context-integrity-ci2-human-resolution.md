# Context Integrity CI-2.2 — Human Resolution Loop

## Product outcome

ReveNew no longer stops at detecting a contradiction.

For a persisted active finding, a human can now record a controlled decision
in the same Context Integrity surface where the evidence is shown.

The UI intentionally says `Consemnează decizia`, not `Fixează automat`.

## Human options for source association mismatches

- `Păstrează contextul CRM`
- `Documentul aparține altui context`
- `Documentul este istoric`
- `Constatarea nu se aplică`

The last option requires a human note.

No option mutates the CRM organization, moves a Drive document, changes an
opportunity, sends email, or writes to a provider.

## Safety sequence

1. User sees the exact deterministic finding and persisted row version.
2. User selects a reason.
3. Server Action re-runs current deterministic Commercial Truth.
4. The exact finding fingerprint must still be active.
5. Persisted `row_version` and `finding_key` must still match.
6. Authenticated RPC performs a second compare-and-set under row lock.
7. Actor is derived from `auth.uid()` through `current_profile_id()`.
8. Decision + optional note are appended to audit history.

This is intentionally a double stale check: application re-evaluation plus
database compare-and-set.

## Authorization

Owner/admin/manager can resolve business-visible findings.

A regular member can resolve a finding only when they are the explicit owner of
the associated opportunity.

Owner-private findings can only be resolved by that owner profile.

## Presentation

An exact finding in `resolved` or `dismissed` state is no longer counted as an
unresolved Context Integrity discrepancy in the executive presentation.

The evidence remains visible and the Context Integrity strip becomes:

`Decizie consemnată · Revizuit`

This does not change the underlying source claim or pretend that the source
itself was edited.

## Next phase

CI-2.3 should turn persistent findings into an operational queue:

- unresolved finding count and aging;
- owner + next safe action;
- high-severity prioritization;
- no fake recovered revenue;
- direct path from Recovery Queue to evidence + decision.
