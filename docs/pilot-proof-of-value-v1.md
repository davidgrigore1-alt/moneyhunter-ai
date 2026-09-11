# Pilot Proof of Value V1 — Executive Evidence Surface

## Product objective

The page `/reports/pilot-proof-of-value` already had a strong measurement
foundation:

- a frozen cohort;
- immutable baseline and final snapshots;
- success criteria defined before the result;
- human confirmation;
- integrity hashes;
- explicit separation between estimated value and confirmed revenue.

V1 keeps those contracts and replaces the dense implementation with an
executive proof experience designed around one question:

**What changed in the controlled cohort, and what can we actually prove?**

## Source of truth

The official before/after comparison remains:

`PilotContract -> frozen baseline -> frozen final -> comparePilotSnapshots`

Recovery evidence is an additional proof layer, never a replacement for the
immutable snapshot comparison.

The page does not use an AI score or the older heuristic recommendation helper
to decide whether a customer should continue.

## Executive hierarchy

The experience uses a five-stage rail:

1. Contract
2. Baseline
3. Pilot
4. Situație finală
5. Decizie

Once a pilot exists, one primary hero communicates the state of the evaluation.

For an active/final pilot the four executive metrics are:

- Criterii îndeplinite
- Cazuri închise verificabil
- Decizii umane pe context
- Valoare estimată asociată

The financial metric is explicitly marked as **not recovered revenue**.

## Verified Recovery layer

Pilot Proof of Value now reads the durable audit history created by:

- Execution Integrity;
- Context Integrity.

The measurement window begins at the frozen baseline and ends at the current
preview or frozen final snapshot.

Metrics:

- logical cases with activity in the interval;
- unique cases closed through source-driven execution resolution or Context
  Integrity closure;
- human Context Integrity decisions;
- reopened cases;
- average verified resolution-cycle duration;
- estimated opportunity value associated with touched cases.

Opportunity value is deduplicated and currencies remain separate.

### Resolution duration

Duration is calculated from the most recent `detected` or `reopened` lifecycle
event that precedes the closure event.

If a lifecycle start cannot be proven from audit history, no duration is
invented.

### Examples

Up to four resolved examples reuse the existing `ResolutionEvidenceSheet`.
This keeps the proof interaction identical to Recovery Timeline:

`Vezi dovada -> Resolution Evidence`

The proof example is displayed only when the resolved case can be matched to
the pilot interval without ambiguity.

## Setup experience

Pilot setup is organized into exactly three steps:

1. Definire
2. Cohortă
3. Criterii

The server-action form field names and server-side controls remain unchanged.

The standard commercial period is presented as 14 days, but the existing
server contract remains authoritative.

## Visual system

The page follows current ReveNew identity:

- matte surface;
- black/white hierarchy;
- champagne intelligence accent;
- restrained semantic status color only where necessary;
- one 18px hero surface;
- hairline separators;
- no decorative gradients;
- no glow;
- no particles;
- no horizontal table;
- no card soup;
- no microscopic body copy;
- no animation loops;
- progressive disclosure for methodology.

The comparison is intentionally a list rather than a data table.

## Financial boundary

Three concepts are never collapsed:

1. Valoare estimată în cohortă
2. Valoare estimată asociată cazurilor urmărite
3. Venit confirmat

A resolved execution break proves operational closure, not causal revenue
generation.

## Failure behavior

If durable audit history is partially unavailable:

- the frozen pilot comparison remains visible;
- Recovery Proof is explicitly marked partial;
- missing evidence is not reconstructed by AI or heuristic inference.

## No new persistence

V1 adds no migration and changes no pilot persistence contract.

It is a read-only evidence and presentation layer on top of:

- existing pilot snapshots;
- Execution Integrity audit;
- Context Integrity audit;
- existing opportunity data.

## Acceptance target

A CEO should be able to answer within 15 seconds:

- what cohort was measured;
- whether operational control improved;
- which criteria were met;
- which commercial breaks were actually closed;
- what evidence supports selected closures;
- what value was associated;
- what cannot be claimed from the pilot.

That is the commercial purpose of the surface.
