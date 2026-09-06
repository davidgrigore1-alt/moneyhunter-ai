# ReveNew — landing completion QA

2026-09-06. MEDIUM marketing-only completion after the human-approved E0 checkpoint `ea1e26f`. No protected infrastructure, auth, database, dependencies or provider implementation changed.

## Three visual correction passes

1. **Art direction:** directly inspected the rendered commercial thread, workbook, workflow, ecosystem, financial snapshot, trust boundary, fit, FAQ and closing CTA. Corrected new-CSS specificity that shrank icons, wrapped fit numbering and missing FAQ heading styling. Restored the shared CSS to the exact approved E0 checkpoint.
2. **Product and motion:** observed finite progression and final-state hold; corrected workflow return-path geometry and workbook row consistency. Verified source-link focus, native FAQ keyboard toggling, Liquid hover/focus and meaningful reduced-motion output. Browser observation confirmed an offscreen evidence scene stayed paused at phase 1. Hidden-tab timing and scene handoff are covered by the coordinator lifecycle tests; browser tab-switch tooling did not provide a reliable hidden-state observation, so no separate browser-hidden-state claim is made.
3. **Responsive and quality:** checked actual DOM dimensions and horizontal bounds at all eight requested sizes below. Directly inspected phone and tablet workflow, workbook, ecosystem and trust/fit compositions. Corrected mobile source connections and prevented the XLSX range/formula labels from breaking. Tested lower-chapter text at 200% in a 1440px viewport using a temporary stylesheet, then removed it; content reflowed without page overflow. FAQ focus remained visible. The final production smoke check exposed overflow from the moving trust signal in normal motion; a local clipping track now bounds only that signal, preserving the surrounding architecture. The production build was repeated for this concrete correction. No screenshot gallery or video report was created.

## Viewports

| Viewport | Horizontal page overflow / lower content outside viewport |
|---|---|
| 1920 × 1080 | None detected |
| 1440 × 900 | None detected |
| 1366 × 650 | None detected |
| 1024 × 768 | None detected |
| 834 × 1112 | None detected |
| 768 × 1024 | None detected |
| 390 × 844 | None detected |
| 360 × 800 | None detected |

All observed lower-page image assets loaded. Dev-browser logs contained Fast Refresh reload warnings during editing, not application exceptions. The production preview was reloaded: all nine chapters rendered, the first theatre scene was Intelligence, no runtime exception was observed, and the demo submit button remained disabled. After the signal correction, all eight sizes were checked again in normal motion at phase 3 with no horizontal page overflow. The final phase 6 was also verified in normal motion after completing the sequence through the reduced-motion preference: no page overflow. Temporary text, media and viewport overrides were removed. No cross-browser or assistive-technology certification is claimed.

## Automated validation

- Focused marketing/positioning and chapter lifecycle tests: **41 passed, 0 failed**.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check` and explicit whitespace checks for new marketing files: passed.
- `node scripts/validation/run-phase4-local.mjs build`: passed. Next.js generated all 53 static pages; `/` is statically rendered, with 17.7 kB route JS and 134 kB first-load JS reported by the build.
- Full repository suite, migration/security gates and live provider tests deliberately omitted: this change is isolated to marketing, and does not alter those boundaries. The requested production build passed.

E0 files were compared against the checkpoint: unchanged. The page diff contains only the lower-chapter import/render and footer render. The lower completion is a separate commit after E0, as requested for the subsequent Preview deployment. The unused earlier `public/marketing/excel-evidence.png` remains outside that commit.

## Real blockers

- `/solicita-demo`: no approved receiving channel; submission remains disabled, with no fake success.
- `/privacy` and `/terms`: approved legal content is still incomplete.

Local preview: `http://localhost:3001/`.

## Authorized review publication

After local completion, the user explicitly authorized a separate landing commit, push to `astra/product-transformation`, and a Vercel Preview deployment. The existing `.vercel/repo.json` associates this repository with project `revenew`; its Git link points to `davidgrigore1-alt/revenew` and its production branch is `main`. No new Vercel project, production promotion, environment-variable change or remote migration is part of this publication. Existing deployment protection is retained. Remote deployment status and smoke results are reported separately after deployment, not inferred from this local QA record.

## Executive polish — 6 September 2026

Baseline: `42b4b46`, inspected first on the deployed branch Preview, from the hero through all nine chapters and the footer. E0 remains frozen at `ea1e26f`. This polish changes only the lower landing and three small local provider SVGs; it does not change shared hero styles, the public navigation, protected UI, provider implementation or any backend boundary.

Exactly three purposeful passes:

- **A / Macro:** retained the chapter structure and conversion path. Replaced the almost invisible pending illustration text with readable content and progression through connector/selection accents. Neutralized tinted secondary surfaces and human-gate fills; made estimated value champagne. Grouped evaluation-only providers by workflow family and added official Notion, Zoom and Dropbox marks. Five supported sources receive sequential connection paths; evaluated providers receive none. Removed repetitive lower copy and framed the closing R mark with two fine rules.
- **B / Micro:** normalized panel radii, increased supporting text, and removed the workbook's decorative shadow. Corrected the small XLSX rail mark, resolved the official Notion black CSS token for standalone SVG rendering, and verified the provider marks in-browser. Workflow titles remain 14px at tablet widths. Tenant isolation remains visible on tablet instead of disappearing at the breakpoint. FAQ answers use 15px text and a visible keyboard focus; workbook focus exposes the cited selection immediately.
- **C / Responsive and motion:** actual DOM bounds checked at 1440×900, 1366×650, 1024×768, 834×1112, 820×1180, 768×1024, 390×844 and 360×800. No horizontal page overflow or lower-content spill was detected. Directly inspected tablet workflow/control/ecosystem and phone evidence/provider arrangements. Corrected a real phone defect: the two-line Drive description displaced its source port; reserved label height now aligns the first three ports. Observed E0 progressing from Ask to Companies, offscreen chapter pause, final connection hold, native menu anchors, FAQ keyboard operation and Liquid hover/focus. Reduced-motion reload rendered all six chapter phases at 6, stopped, with the trust signal hidden. No browser runtime exception was observed. Temporary media and viewport overrides were removed.

No screenshot gallery, new dependency, autonomous sending, integration capability claim or production deployment is introduced. The receiving-channel and legal-content blockers above remain unchanged. Final automated gates and the new deployed smoke result are reported with the separate polish commit.
