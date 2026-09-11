# ReveNew — Pilot Visual Excellence V1

## Scope

This sprint implements the approved visual direction in the actual product.
It is not a mockup and it does not change the pilot measurement contract.

Primary surface:
- `/reports/pilot-proof-of-value`

Secondary continuity polish:
- `/reports/enterprise-pilot-pack`

The general `/reports` overview is intentionally not redesigned in this
package. It belongs to the later Executive Reporting phase.

## Visual north star

The surface should feel:
- iOS / Apple-inspired, not copied;
- enterprise, calm and expensive;
- black / white / champagne;
- sparse but not empty;
- readable at 100% zoom;
- immediately understandable by a CEO;
- free of AI-decoration, glow, sci-fi effects and card soup.

The design uses:
- one strong hero;
- hairline separators;
- 16–20px major radii only where useful;
- spacious inputs and list rows;
- strong text hierarchy;
- deliberate progressive disclosure;
- one clear action per decision state.

## What V1 fixes

### 1. Cramped form and metric boxes

Definition fields now have explicit internal padding.
Cohort rows have a larger minimum height.
Criterion targets use a dedicated two-part capsule:

`[ 20 | pp ]`

The number and unit have separate internal padding and a subtle divider.
The unit is no longer visually stuck to the edge of a generic input.

### 2. Metric unit explanation

A native, accessible `<details>` information control appears next to
`Criterii`.

It explains:

**pp**
Puncte procentuale. Difference between the baseline percentage and final
percentage. Example: 60% → 80% = +20 pp.

**cazuri**
Absolute opportunity count from the same cohort used for reduction criteria.
Example: 6 overdue follow-ups → 3 means a reduction of 3 cases.

**înregistrări**
Completed action records observed during the pilot interval for cohort
opportunities. It is not a count of opportunities and it is not revenue.

The copy is grounded in `commercial-state-v1`.

### 3. Stage comprehension

The five-stage rail now includes one short explanatory line per stage:

1. Contract — Definește pilotul
2. Baseline — Fixează situația inițială
3. Pilot — Rulează și monitorizează
4. Situație finală — Măsoară rezultatele
5. Decizie — Analizează și decide

### 4. Final confirmation

The old loose text + checkbox + button arrangement becomes one premium,
aligned confirmation surface:

- icon;
- decision title;
- concise explanation;
- clear checkbox block;
- high-contrast primary CTA.

The CTA keeps the existing server action and explicit human confirmation
contract.

### 5. Managerial decision

The same interaction pattern is used for closing the pilot.

The copy explicitly says that closing:
- preserves frozen evidence;
- does not imply commercial continuation;
- does not turn estimates into revenue.

### 6. CTA contrast

Primary confirmation buttons have explicit champagne background and dark
foreground, independent of accidental inherited text color.

### 7. Enterprise Pilot Pack continuity

The proposal page keeps all existing content and data semantics, but receives
the same spacing and surface discipline:
- more section padding;
- more card padding;
- calmer borders;
- matching radius hierarchy;
- consistent champagne eyebrow treatment.

## Business semantics intentionally unchanged

This sprint does NOT change:
- pilot persistence;
- cohort freezing;
- baseline/final snapshot logic;
- criteria calculation;
- Execution Integrity;
- Context Integrity;
- provider calls;
- email behavior;
- AI/model behavior;
- revenue attribution.

No migration is added.

## Manual QA

### Setup

Open:

`http://localhost:3001/reports/pilot-proof-of-value?pilot=new`

Check:
- stage rail is understandable without explanation;
- fields have comfortable left/right padding;
- cohort rows breathe;
- target capsules have centered values and comfortable unit spacing;
- info control opens cleanly and explains pp/cazuri/înregistrări;
- no horizontal scroll.

### Active pilot

Open the current pilot.

Check:
- stage 03 reads clearly;
- comparison rows remain calm;
- proof surface remains visually separate from financial claims;
- no tiny labels.

### Final confirmation

For an active pilot with final preview:
- checkbox is aligned with its two-line explanation;
- CTA text is fully readable;
- CTA remains gold + dark text;
- the requested action is obvious in under 3 seconds.

### Managerial decision

For `final_frozen`:
- the same component language is used;
- checkbox and CTA align perfectly;
- the consequence of closing is explicit.

### Proposal

Open:

`http://localhost:3001/reports/enterprise-pilot-pack`

Check:
- section padding is visibly more generous;
- text never touches card walls;
- no content semantics changed.

## Freeze rule

Do not continue polishing radius/shadows indefinitely.

Freeze this surface when:
- no alignment defects remain;
- 100% zoom is readable;
- 1024px and narrow layouts are clean;
- the confirmation actions are instantly understandable;
- the unit guide removes ambiguity;
- all validation gates pass.
