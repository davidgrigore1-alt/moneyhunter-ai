# Product simplification — Visual Gate 3

Continuation of the approved Gate 2 worktree. The latest user master brief supersedes earlier visual requirements where it explicitly requests calmer controls, neutral navigation and progressive disclosure. Attio references inform hierarchy only. Public landing stays unchanged. No commit, push, deploy or reset.

## Execution and risk

HIGH: protected UI convergence plus a narrow authenticated CRM mutation. Preserve server-derived workspace roles, RLS, provenance and the prepared/approved/executed distinction. Use the real local authenticated demo. The existing 1,039-file starting hash inventory is in `artifacts/product-convergence-gate3/baseline.json`.

Ordered work: shared controls/navigation; saved views and controlled product help; concise case answers and opportunity registry; in-context primary contact; natural-language workflow draft and supported revisions; discoveries; responsive utility surfaces; scoped validation and browser evidence. Stop at the visual gate before final release QA.

## Findings and behavior

- Saved-view success with zero count was not reproduced on the starting runtime. The new UI uses the confirmed server row, supports rename/open/delete, and labels privacy explicitly under a closed disclosure.
- Product-help answers use controlled guides and no commercial evidence. Business questions retain the evidence pipeline.
- Operational answers use actual authorized intervention projections, concise conclusions and per-case details. Evidence remains inspectable.
- Browser testing found direct CRM contact INSERT denied by the existing table grants. Two narrow authenticated functions now support selection and atomic creation plus selection. No table grants or RLS policies were broadened. Both migrations were applied only to the running local Supabase database and are immutable after application.
- Contact creation uses a stable request ID. Replay cannot replace a later primary-contact decision. The local browser created `99209c0f-45e8-406d-81cd-0944f59503ef`, explicitly named Contact validare Gate 3, in the isolated demo company Orizont. Its missing-primary-contact signal disappeared on refresh.
- Workflow descriptions currently use supported deterministic interpretation, explicitly labelled as guided interpretation without a generative model. Unsupported timing, external-source automation and manager routing are displayed as limits. Draft creation and activation remain separate.

## Validation in progress

Typecheck and the real PostgreSQL contact checks passed. SQL verification rolls back its test fixtures, checks one primary contact, foreign company/tenant/actor denial, audit, replay and preservation of a newer decision.

The first full suite found 50 failures (1,185 passed, 3 skipped). New import dependencies in isolated test harnesses were repaired; remaining failures are being classified, not silently waived. Workflow expectations intentionally change from ready to partial when the trigger has no live automatic runtime source; primitive and safety assertions remain intact.

Final route, screenshot, text-size, build and residual issue inventory will be added after browser checks.

## Focused follow-up — 9 September 2026

Latest requested pass: align saved-view controls and retain private product help; preserve in-company primary-contact selection/creation; refine only the three entity icon colors; retain compact opportunity filters and case-based intelligence answers; clarify guided workflow examples and inactive draft semantics. Existing sidebar height density is preserved.

Public acquisition is now wired through `/solicita-demo` to `marketing_demo_requests`, with a read-only `/admin/leads` surface restricted by platform-admin permission and RLS. The service-only intake validates fields/consent/honeypot, serializes rate checks and deduplicates exact request replay. Migration `20260909011852_marketing_demo_requests.sql` was applied to local PostgreSQL only. No email or meeting is sent/scheduled. One clearly labelled browser QA request was retained locally; SQL fixtures and temporary role changes were rolled back.

Validation: 58 focused tests passed, typecheck, lint, optimized Next build and migration integrity passed. Contact atomicity/tenant denial/audit and lead persistence/replay/consent/rate bounds/admin read/revocation were verified against local PostgreSQL. Browser covered Companies, Contacts, Company 360, Opportunities, workflow creation/index, Intelligence and the landing CTA/form at desktop, 1366×650 and 390px mobile for the affected main layouts. All measured layouts had no page-level horizontal overflow; protected sidebar fit at laptop height. Primary-contact save returned focus and updated the company. Saved-view input/button aligned at 44px. Product-help and two-case deterministic intelligence answers were verified. Public form required fields and consent, then confirmed one persisted row. The ordinary demo account was denied `/admin/leads`; positive admin rendering was tested with a controlled component test and real RLS, not a privileged browser account.

Evidence: `artifacts/gate3-followup/` contains focused logs, six compact screenshots and viewport measurements. The 72-file frozen-marketing check found only the two authorized contact-flow exceptions (`solicita-demo/page.tsx`, `DemoRequestForm.tsx`); landing layout, styles and catalogue remain unchanged.

Remaining: repository security gate is blocked by the pre-existing `.env.local.backup-20260908` credential-bearing backup (untouched). `/privacy` remains a placeholder and must be completed before public launch. Anti-spam is basic, not a CAPTCHA/edge abuse service. Platform-admin review inherits the existing protected shell's workspace requirement. No live generative/provider acceptance, full-suite rerun, remote migration or release QA is claimed. No commit, push or deploy.
