# Execution Integrity V1.1 — Immediate Re-evaluation

## Product change

Execution Integrity V1 made high-value execution breaks durable.

V1.1 closes the interaction loop:

`real user action -> fresh deterministic evaluation -> durable reconciliation -> UI refresh`

The operator no longer has to return to Dashboard later for the persistent
state to catch up.

## Covered first-party mutations

### Opportunity execution

- create next action;
- complete next action;
- assign/change owner;
- pipeline transition;
- record outcome;
- reopen opportunity.

### Commercial response

Recording a commercial response creates a real next action. Execution
Integrity is re-evaluated after both writes and audit events succeed.

### Signal / approval lifecycle

Linked opportunity state is re-evaluated after:

- signal analysis;
- approval;
- rejection;
- duplicate/postponed review decision;
- ignore;
- archive;
- conversion.

This is particularly important for `pending_approval`.

## Correctness rule

V1.1 does not directly mark an Execution Integrity case resolved.

It always reloads the current opportunity and linked signals, rebuilds
`OpportunityCommercialState`, runs the deterministic detector and calls the
existing reconciliation contract.

Therefore:

- completing an overdue action resolves `overdue_next_action`;
- if no pending next action remains, `missing_next_action` may immediately
  open in the same evaluation;
- creating the next action then resolves `missing_next_action`;
- assigning an owner resolves `unassigned_owner`;
- an approval decision resolves `pending_approval`.

This prevents a false green state.

## Failure behavior

Execution Integrity is observability/control metadata around the real business
mutation.

If immediate evaluation or persistence fails:

- the real mutation remains successful;
- the helper returns `unavailable`;
- no open case is falsely resolved;
- route invalidation still runs best-effort;
- no source/provider mutation is attempted by Execution Integrity.

## Security and scope

- current business is derived server-side;
- opportunity is reloaded server-side;
- tenant mismatch fails closed;
- linked signal context is reloaded before declaring coverage complete;
- no browser-supplied business identity;
- no service-role client in browser;
- no provider call;
- no model call.

## UX

Existing client controls already call `router.refresh()` after successful
server actions.

Because the server now waits for the Execution Integrity reconciliation first,
the refreshed interface reflects the new persistent state immediately.

There is no extra button, spinner, dashboard or settings surface.

## Important transition example

Before:

`Follow-up restant · Urmărit 4 zile`

User completes the actual task.

After the same action:

- overdue case resolves;
- if there is no next action, ReveNew immediately shows
  `Fără acțiune următoare`;
- after the user creates the real next action, that case resolves too.

The system follows execution continuity rather than celebrating a partial
action too early.

## Next phase

After V1.1 is proven manually, the highest-value next step is a
**Verified Recovery Timeline / Resolution Evidence** surface:

- what break was detected;
- how long it stayed open;
- what real source change resolved it;
- who performed the underlying action;
- estimated opportunity value associated with the case;
- never presented as revenue recovered unless the commercial outcome confirms it.

That turns operational control into buyer-visible proof of value.
