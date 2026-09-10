# Verified Recovery Timeline / Resolution Evidence V1

## Product objective

The surface exists to answer four questions without requiring the buyer to
read an audit log:

1. What did ReveNew detect?
2. How long did it stay open?
3. What changed in the real operating state?
4. What evidence supports that resolution?

It is proof of operational control, not decoration.

## Information architecture

### Recovery Timeline

Placed directly after Commercial Recovery on Dashboard.

The top of the surface contains exactly four executive metrics:

- Deschise
- Rezolvate
- Timp mediu de rezolvare
- Valoare estimată asociată

The default list is intentionally capped at six cases. When active and
resolved cases both exist, the initial viewport reserves space for both so
the buyer sees current risk and proof of closure without expanding anything.

Active/reopened work is shown before resolved proof, with separate section
labels:

- Necesită atenție
- Rezolvate recent

Each row has one dominant action:

`Vezi dovada`

### Resolution Evidence

The detail surface is a right-side sheet on desktop and full-screen on narrow
viewports.

Its hierarchy is:

1. current state + plain-language explanation;
2. detected / resolved / duration;
3. what changed;
4. evidence;
5. lifecycle;
6. commercial context;
7. one final action.

The sheet is keyboard-dismissible, traps focus and restores focus after close.

## Visual direction

The implementation deliberately uses:

- one large calm surface rather than nested cards;
- 18px outer radius only at the main surface;
- hairline separators;
- 25–31px section title;
- 16px item titles;
- 13.5px explanatory copy;
- metadata kept at 10.5px or above;
- subtle champagne/intelligence accent;
- no decorative gradients;
- no glow;
- no particles;
- no looping animation;
- no horizontal scrolling;
- 140–180ms entrance motion only.

The result should feel closer to a premium native decision surface than a
dashboard widget.

## Trust model

The timeline is read-only.

It does not mutate:
- opportunities;
- actions;
- approvals;
- documents;
- Context Integrity;
- Execution Integrity.

Execution resolution evidence is shown as a specific underlying audit event
only when:
- the event type is compatible with the execution break;
- it belongs to the same opportunity/source where applicable;
- it occurred within a narrow 10-minute window around durable resolution.

If that proof is unavailable, the UI uses a deliberately conservative
statement such as:

`Starea sursei nu mai îndeplinește regula care a generat cazul.`

Context Integrity human decisions use the persisted resolution reason and
resolution audit actor when available.

Repeated identical audit observations are compressed in the visual lifecycle
so the drawer never turns into a raw log viewer.

## Financial language

Opportunity value is deduplicated per opportunity and never merged across
currencies.

The surface says:

`Valoare estimată asociată`

and explicitly:

`nu venit recuperat`

A resolved execution/context case is evidence that a commercial break was
closed, not evidence that cash was collected.

## V1 evidence window

- active cases remain visible regardless of age;
- resolved cases are shown from the last 30 days;
- maximum 24 cases are shaped for the surface;
- default visible list is six;
- maximum three evidence references are exposed per case;
- maximum six meaningful lifecycle moments are exposed per case.

These limits are cognitive-load constraints, not data deletion.

## Next value step

After this surface is proven in daily use, the next commercially important
layer is a pilot-facing Proof of Value summary:

- cases detected;
- average time to closure;
- execution breaks actually closed;
- human-reviewed context conflicts;
- opportunity value associated with controlled cases;
- confirmed outcomes kept strictly separate.

That can become part of the 14-day pilot review without making unsupported ROI
claims.
