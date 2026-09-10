# Execution Integrity V1 — Durable Commercial Breaks

## Why this is the next value layer

Context Integrity now detects, persists and resolves contradictions between
commercial context and connected evidence.

The other expensive failure mode is execution itself:

- the next action is overdue;
- an open opportunity has no next action;
- nobody owns the opportunity;
- an approval is still blocking execution;
- prepared commercial material has not advanced.

These are not "insights". They are operational breaks.

Execution Integrity V1 makes the five highest-value deterministic breaks
durable.

## V1 detector

Supported codes:

1. `overdue_next_action`
2. `missing_next_action`
3. `unassigned_owner`
4. `pending_approval`
5. `prepared_document_not_advanced`

Lower-signal completeness warnings such as missing dates, missing values,
stale activity or missing decision-maker are deliberately excluded from V1.

`proposal_without_follow_up` is also not persisted separately because it is
already represented by `missing_next_action`; this avoids duplicate work.

## Source-driven resolution

Execution Integrity differs intentionally from Context Integrity.

A user cannot simply mark an overdue action as "resolved".

The durable case resolves only when a complete deterministic evaluation no
longer detects the break.

Examples:

- overdue action -> action completed or legitimately rescheduled;
- missing next action -> a real next action is created;
- missing owner -> an owner is assigned;
- pending approval -> approval is no longer pending;
- prepared document -> document advances out of the unconfirmed prepared state.

This gives ReveNew an important trust property:

**the product verifies that execution changed instead of trusting a cosmetic
"done" button.**

## Recurrence

One logical break type per opportunity gets one durable `caseKey`.

The exact source state gets a separate `findingKey`.

Therefore:
- changing the due date while still overdue updates the same case;
- resolving the overdue action source-resolves the case;
- a later overdue action reopens the same logical case and preserves history.

## Audit

Repeated identical observations increment `detection_count` but do not append
audit events.

Audit events are reserved for real lifecycle transitions:

- detected
- changed
- resolved
- reopened

## UI convergence

The existing Execution Control Center remains the execution surface.

Execution Integrity adds:
- persistent age (`Urmărit · 4 zile`);
- active durable break count;
- source-backed lifecycle beneath the existing deterministic case.

No additional dashboard is created.

## Money boundary

Opportunity value remains estimated opportunity exposure. It is not recovered
revenue, booked revenue or collected cash.

## Next phase

After V1 is proven on real cases:

Execution Integrity V1.1 should connect source-resolution to the highest-value
existing action controls so that completing/rescheduling/assigning causes an
immediate re-evaluation, rather than waiting for the next dashboard read.
