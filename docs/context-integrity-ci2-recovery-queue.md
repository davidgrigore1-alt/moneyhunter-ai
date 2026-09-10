# Context Integrity CI-2.3 — Operational Recovery Queue V1

## Product decision

Do **not** create another large "Recovery Queue" page.

The current dashboard already contains an `ExecutionControlCenter` and an
existing decision queue. Adding a third control center would increase cognitive
load and split the operator's attention.

CI-2.3 therefore adds a compact persistent Context Integrity lane directly to
the existing dashboard.

It appears only when an unresolved persistent Context Integrity case exists.

## What the user gets

For each affected opportunity, one row answers:

- What account/opportunity needs attention?
- What class of context problem exists?
- Why does it matter?
- Who owns the opportunity?
- How long has the issue remained unresolved?
- What estimated opportunity value is associated?
- What is the safe next action?

The CTA routes directly to the existing opportunity Context Integrity review
surface.

## Queue semantics

Only persistent findings in:
- `open`
- `needs_review`

are visible.

`resolved`, `dismissed`, and `superseded` findings are excluded.

Multiple findings on one opportunity become one queue row. This avoids noisy
duplicate work.

## Priority semantics

No hidden AI score is introduced.

Ordering is deterministic:

1. finding severity;
2. age of the unresolved case;
3. opportunity title.

This is deliberately separate from the existing commercial intervention
ranking. CI-2.3 does not pretend those two ranking systems are mathematically
equivalent.

## Data boundary

The queue uses:
- persisted finding metadata;
- already-authorized opportunity data.

It does not re-read source bodies, call Google providers, use an LLM, or mutate
CRM/provider data.

The loader uses the authenticated RLS client and receives only opportunity IDs
already scoped by the dashboard for the current viewer.

## Money language

Opportunity values are shown only as estimated value associated with the case.

Different currencies remain separate.

The UI explicitly states:

`Valoarea afișată este estimată, nu venit recuperat.`

## Next product step

Once V1 proves useful in daily operation, the next convergence step should be
to connect durable non-Context-Integrity execution breaks (overdue actions,
unowned steps, pending approvals) to the same lifecycle contract. Only then
should the product expose a truly unified commercial Recovery Queue.
