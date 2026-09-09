# ReveNew — premium product visual pass

Validated locally on 8 September 2026, following the accepted Gate 1 foundation. Scope: Operational Intelligence, Control Center, Reports, and explicitly adopted interaction controls. The public landing is unchanged. Existing dirty Gate 1 changes are preserved. No commit, push, deployment, remote migration, or demo reset was performed.

## Files changed in this pass

| Area | Files | Result |
| --- | --- | --- |
| Shared controls | `src/components/ui/PremiumControls.module.css` (new) | Opt-in primary/secondary actions, segmented controls and disclosure affordances. The global Button defaults are unchanged. |
| Operational Intelligence | `src/components/intelligence/AskReveNew.tsx`, `CopilotConversation.tsx`, `IntelligenceAnalysisStatus.tsx`, `IntelligenceDecisionBrief.tsx`, `IntelligenceEvidence.tsx`, `OperationalIntelligence.module.css` | Composer hierarchy, active analysis treatment, executive answer, structured cases, source disclosures and limitations. |
| Control Center | `src/components/dashboard/ExecutionControlCenter.tsx`, `ControlCenterVisuals.tsx`, `ControlCenter.module.css` (new) | Refined KPI strip, filters, selected case, detail facts, disclosure and charts. |
| Reports | `src/app/(protected)/reports/page.tsx`, `src/components/reports/ReportActions.tsx`, `Reports.module.css` (new) | Executive summary, operations, export and print presentation. |
| Focused tests | `tests/execution-control-center.test.mjs`, `tests/report-actions.test.mjs` (new) | Queue-before-analysis contract; exact export/print text and safe rendering. |
| Handoff | `docs/design/product-premium-pass.md` | Decisions, evidence and residual scope. |

The table identifies this pass only. Other modified/untracked files reported by Git belong to the existing worktree and were not added to this scope.

## Exact visual decisions

- **Selective glass:** 8 px control corners, restrained top highlight and inset border, minimal 2 px shadow, optional 8 px backdrop blur on secondary actions. Transitions affect color/border only (160 ms), with visible 2 px keyboard focus. No scale animation. Data tables, evidence lists and long answers remain matte.
- **Composer:** distinct authorized-context header, visible input label, 18/28 px input typography, separated action footer and quick prompts. The main action remains 204 × 44 px; cancellation is also 44 px tall. A short-viewport rule reduces spacing without scaling the page.
- **Active analysis:** three small animated bars and a moving indeterminate hairline. This communicates activity only; it does not invent stages, completion percentages or provider progress. Existing live status, cancellation and request lifecycle remain intact. Reduced-motion preference disables the animations.
- **Answer:** executive conclusion leads, followed by numbered case cards with separate title, estimated value, reason, owner, cited evidence and recommended next step. Gold is reserved for decision emphasis. Mobile case headers place the amount below the title; facts adapt to two columns. Missing owners remain explicitly unconfirmed.
- **Evidence and limitations:** matte disclosure with source/evidence counts, type and observation date; the existing inspector retains classification, time, coverage and source navigation. Limitations use a restrained amber left edge and explicit copy, without implying complete Google/document coverage.
- **Control Center:** intervention queue retains primary DOM order and stays before collapsed analysis. KPI values are aligned in a unified row (two columns on mobile). Selected case and recommended step use faint gold emphasis; fact backgrounds remain neutral.
- **Charts:** fewer nested borders, quieter grid and current primary palette. Chart cards stack below 1280 px. The bar Y-axis reserves 58 px so the top label remains fully visible. Existing domains, values, dates, currency conversion, tooltips and accessible text tables are preserved.
- **Reports:** retain the three routes/views—Rezumat, Execuție, Export. A clear executive heading and separated KPIs distinguish estimated pipeline from confirmed recovery. Small distribution bars represent opportunity counts, alongside the exact table; labels clarify that counts span currencies while displayed amounts cover RON. The mobile table fits its 310 px content area without horizontal scrolling.
- **Export:** three explicit existing actions—copy text, download TXT, browser print/PDF—with icons, format descriptions and a reviewable text preview. The current confirmed-revenue figure is also included in exported text. The print stylesheet shows the actual report text and removes shell indentation and controls. No external sharing integration was introduced.

No authorization, database queries, prioritization, model selection, provider behavior, approval or execution logic was changed in this visual pass.

## Validation performed

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `git diff --check` — PASS; Git emits existing Windows LF/CRLF normalization notices, not whitespace errors.
- Focused Node tests — **150 passed, 0 failed, 0 skipped**:
  - `tests/operational-intelligence-ui.test.mjs`
  - `tests/phase4-intelligence.test.mjs`
  - `tests/phase4-orchestration.test.mjs`
  - `tests/pass3a-reports-settings-convergence.test.mjs`
  - `tests/report-metric-consistency.test.mjs`
  - `tests/reporting-fx-g3f1.test.mjs`
  - `tests/commercial-interventions.test.mjs`
  - `tests/execution-control-center.test.mjs`
  - `tests/control-center-polish-v4.test.mjs`
  - `tests/ai-control-center-ux.test.mjs`
  - `tests/report-actions.test.mjs`

Logs and screenshots: `artifacts/product-premium-pass/`. Local review gallery: `http://localhost:3036/index.html` while its local server is running. Screenshots show the authenticated local demo workspace, not fabricated UI data.

### Browser evidence

Chrome against the current development server at `http://localhost:3001`:

| Surface | Inspected sizes/states | Observed result |
| --- | --- | --- |
| Intelligence | 1440 desktop, 1366 × 650 laptop, 834 tablet, 390 × 844 mobile | Composer, real Romanian answer, case structure, expanded evidence, source inspector and limitations render without page overflow. |
| Active analysis | 1366 × 650, normal and reduced motion | Real active loading captured; action and cancel remain 44 px tall and aligned. Cancellation preserves the question. Reduced-motion computed animations are `none`. |
| Control Center | 1440, 1366 × 650 | Queue begins at about y=401; first case remains visible within the laptop viewport. Owner filter reduces 8 cases to 2 and restores correctly. |
| Charts | 1440, 1024, 390 | Two columns on desktop and one at 1024/mobile; complete axis labels, tooltip and textual disclosure remain readable. RON/EUR toggle reflects the existing dated conversion. |
| Reports | 1440, 1366 × 650, 834, 390 | All three views inspected; summary hierarchy, distribution table, export preview and visible keyboard focus verified. Mobile document width 380 px within a 390 px viewport; table and container both 310 px. |
| Print presentation | Browser print-media emulation at 1366 | Actual report text, including 18,500 RON confirmed recovery, is visible; application controls and left shell padding are removed. |

Observed demo totals remain explicitly bounded: Control Center has 8 review cases, 240,500 RON and 12,000 EUR in separate exposure totals. Reports show 9 active opportunities, 271,500 RON estimated pipeline, and 18,500 RON confirmed recovery. These surfaces use their existing scopes and are not represented as interchangeable totals.

The latest inspected browser console contains no new application error after final source edits; an earlier Fast Refresh full-reload warning remains from development. The final active-loading screenshot was inspected directly, rather than inferred from a settled answer.

## Deliberately omitted and remaining limitations

- No full-suite run, production build, database/RLS suite or release gate was run for this scoped presentation pass. Earlier Gate 1 results are not claimed as validation of this patch.
- Chrome viewport checks are not physical MacBook/Safari certification. A short Safari check on actual hardware is the next useful visual follow-up.
- Error/fallback and cancellation contracts are covered by focused tests; not every provider failure or empty tenant was manually reproduced in the browser.
- Print CSS and rendered text were verified; physical printing, generated PDF pagination, actual clipboard contents and an OS-level downloaded-file inspection were not exercised in this pass.
- AI source coverage remains incomplete where the product reports it. The visual pass does not add integration coverage or turn prepared work into executed work.

The scoped visual pass is complete locally; this document is not a release-readiness claim.
