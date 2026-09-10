# FTUE profile bootstrap verification — 9 September 2026

Scope: current checkout at `32c26d6`, local Supabase only. No reset, remote migration, commit, push or deployment.

## Root cause established before edits

The live `authenticated` role had SELECT and the permitted profile UPDATE columns, but no table or column INSERT privilege on `public.profiles`. The INSERT policy already checked `user_id = auth.uid()`; it did not depend on an existing profile or `current_profile_id()`. The authenticated server payload had the correct user identity. PostgreSQL rejected the statement before RLS evaluation. The application classifies SQLSTATE `42501` as `profile_rls_denied`, which covers this missing-privilege case too.

Existing demo accounts used SELECT on their existing profiles and never reached INSERT. A normal local Auth signup with zero profile rows reproduced the real `/auth/bootstrap` redirect to `retry?reason=profile_rls_denied` before applying the fix.

The subsequent real browser onboarding exposed a second missing-grant defect: `businesses` INSERT failed with `42501`. The required membership, service and target setup tables also lacked INSERT privileges. Existing owner predicates were correct. Owner membership upsert would additionally request UPDATE, while the existing policy intentionally prevents rewriting owner memberships.

## Changes and authority

| File | Change |
| --- | --- |
| `supabase/migrations/20260909122033_profile_bootstrap_insert_privileges.sql` | Authenticated INSERT only on `user_id`, `full_name`, `email`; removes inherited INSERT grants first. |
| `src/lib/auth/profile.ts` | Uses the database-generated profile ID; identity and email still come from the authenticated server user. |
| `supabase/migrations/20260909122855_onboarding_insert_privileges.sql` | Explicit INSERT columns for the existing onboarding business/setup payloads. |
| `src/lib/business/provision-business.ts` | Membership conflict does nothing instead of requesting owner UPDATE. |
| `src/app/auth/bootstrap/retry/page.tsx` | Full dynamic viewport, centered 34rem bounded card, balanced responsive buttons and named region. |
| `scripts/validation/verify-profile-bootstrap-local.mjs` | Repeatable real local Auth/PostgREST/application-route positive and negative verification; removes only its disposable fixtures. |
| `tests/auth-account-flow.test.mjs` | Profile payload authority/default ID and non-rewriting membership replay assertions. |
| `tests/auth-theme-isolation.test.mjs` | Rendered retry region, layout and recovery-link regression. |
| `scripts/validation/migration-integrity-baseline.json` | Registers both reviewed additive migrations. |

RLS remains enabled. No policy was broadened, no privileged RPC was added, and no browser service credential was introduced. Own-profile INSERT still requires `user_id = auth.uid()`. Generated IDs, timestamps and profile roles are outside the new profile grant. Normal profile UPDATE remains limited to the existing allowed fields. Business creation still checks `owner_profile_id = current_profile_id()`. Owner membership creation requires canonical ownership and the current profile; other workspace setup rows require `owns_business(business_id)`. Platform authority remains separate from business ownership.

Both migrations were applied and recorded only in the running local stack; historical migration bytes were unchanged.

## Real local evidence

- Before migration: fresh ordinary signup/session, profile count zero, actual Next bootstrap failed with the reported reason. Fixture removed.
- After migration: fresh ordinary signup/session, actual Next bootstrap redirected to onboarding, profile count exactly one, two replays still exactly one.
- Denied: another user inserting/updating the profile, anonymous INSERT, inserting a chosen profile ID, changing `user_id`, profile role INSERT/UPDATE, and platform administrator self-assignment. Duplicate own identity rejected by the existing unique index.
- Workspace tests: canonical owner INSERT succeeds; another user and anonymous caller cannot create its workspace or setup rows. Owner membership replay creates one row without UPDATE. Cross-user membership INSERT and membership rewrite are denied.
- Browser: a separate new Auth account initially had zero profiles. Normal login reached onboarding; the five-step form created a workspace and reached `/activation?mode=manual`, then `/dashboard`. The dashboard showed zero cases and unconnected sources. SQL confirmed one profile, one workspace, one correct owner membership, zero opportunities. Another bootstrap returned to dashboard without duplication.
- Browser test account was signed out, and only its exact test workspace/account were deleted. Script-created fixtures were also removed. Meridian/demo data was not modified.
- Local Auth has `enable_confirmations = false`; this verifies its supported automatic-confirmation signup/session path. A delivered confirmation-email click in a confirmation-enabled environment was not claimed or tested here.

## Retry presentation

Verified in the authenticated application's browser runtime:

| Viewport | Card rectangle x/y/width/height | Result |
| --- | --- | --- |
| 1440×900 | 448 / 345 / 544 / 210 | Centered, no horizontal overflow |
| 1366×650 | 411 / 220 / 544 / 210 | Centered, visible keyboard focus, equal-width actions |
| 390×844 | 16 / 265 / 358 / 314 | Centered, safe padding, stacked actions, no overflow |

The viewport override was reset. Login/signup and the public landing were not redesigned.

## Validation

- Affected auth tests: **41 passed, 0 failed, 0 skipped**.
- Typecheck, lint, migration integrity, repository security and `git diff --check`: passed after the onboarding correction.
- Full suite: **1,314 total; 1,311 passed; 0 failed; 3 skipped**. Skips are the existing environment-gated Workflow, Drive and commercial-impact PostgreSQL suites; they are not FTUE verification.
- The dedicated local FTUE verifier passed, including actual application bootstrap and the new onboarding privilege checks.
- Production build: passed using the guarded local Supabase environment, with external email/model execution disabled.

The two reproduced local FTUE blockers are corrected. This evidence is not a remote/staging deployment or a blanket release-readiness claim; confirmation-enabled email delivery and the three unrelated skipped suites remain outside this verification.
