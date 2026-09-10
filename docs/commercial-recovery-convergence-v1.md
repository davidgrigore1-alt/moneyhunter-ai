# Commercial Recovery Convergence V1

## Product goal

ReveNew should not make the operator decide which dashboard to inspect.

The dashboard already has a strong Execution Control Center. CI-2.3 added
persistent Context Integrity cases. This convergence pass puts both inside
one commercial recovery surface.

## Information architecture

One control surface:

`Control Center · Commercial Recovery`

Inside it:

1. Executive Snapshot
2. Integritate comercială — persistent Context Integrity cases
3. Execuție comercială — overdue / ownership / intervention cases
4. Secondary operational analysis

The two problem classes stay semantically distinct, but the user no longer
has to scan two unrelated top-level modules.

## Cognitive-load rule

The Context Integrity lane shows at most two rows before progressive
disclosure. Its large standalone header is suppressed when embedded.

No additional route, dashboard or global navigation item is created.

## Trust boundaries

This is presentation convergence only.

It does not:
- change Context Integrity persistence;
- change human resolution semantics;
- change Execution Control Center ranking;
- introduce an AI score;
- merge currencies;
- claim recovered revenue;
- mutate CRM/provider data.

## Next value sprint

After this convergence is visually verified, the next substantive step is
Execution Integrity V1: make the most expensive execution breaks durable,
starting with overdue/missing next actions and missing ownership, then feed
those durable states into the same Commercial Recovery surface.
