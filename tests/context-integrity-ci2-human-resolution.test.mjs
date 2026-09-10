import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "supabase/migrations/20260910173000_context_integrity_human_resolution.sql",
  "utf8"
).toLowerCase();
const action = fs.readFileSync(
  "src/lib/context-integrity/actions.ts",
  "utf8"
);
const strip = fs.readFileSync(
  "src/components/commercial-truth/ContextIntegrityStrip.tsx",
  "utf8"
);
const stripCss = fs.readFileSync(
  "src/components/commercial-truth/ContextIntegrityStrip.module.css",
  "utf8"
);
const snapshot = fs.readFileSync(
  "src/components/commercial-truth/CommercialTruthSnapshot.tsx",
  "utf8"
);
const conversation = fs.readFileSync(
  "src/components/intelligence/CopilotConversation.tsx",
  "utf8"
);
const types = fs.readFileSync(
  "src/lib/context-integrity/types.ts",
  "utf8"
);

test("CI22-01 adds an explicit source-belongs-elsewhere human reason", () => {
  assert.match(types, /"source_belongs_elsewhere"/);
  assert.match(migration, /'source_belongs_elsewhere'/);
});

test("CI22-02 human resolution RPC derives actor from auth context", () => {
  assert.match(migration, /actor_profile_id := public\.current_profile_id\(\)/);
  assert.doesNotMatch(migration, /target_actor_profile_id/);
});

test("CI22-03 resolution RPC is authenticated-only", () => {
  assert.match(
    migration,
    /revoke all on function public\.resolve_context_integrity_finding_v1[\s\S]*from public, anon, service_role/
  );
  assert.match(
    migration,
    /grant execute on function public\.resolve_context_integrity_finding_v1[\s\S]*to authenticated/
  );
});

test("CI22-04 direct authenticated table writes remain unnecessary", () => {
  assert.doesNotMatch(
    migration,
    /grant (insert|update|delete).*context_integrity_findings.*authenticated/
  );
});

test("CI22-05 tenant scope is derived from the finding row", () => {
  assert.match(migration, /public\.can_access_business\(finding_row\.business_id\)/);
});

test("CI22-06 owner-private visibility remains private", () => {
  assert.match(migration, /finding_row\.visibility_scope = 'owner_private'/);
  assert.match(migration, /finding_row\.owner_profile_id is distinct from actor_profile_id/);
});

test("CI22-07 manager-level roles may resolve findings", () => {
  assert.match(migration, /actor_role not in \('owner', 'admin', 'manager'\)/);
});

test("CI22-08 members may resolve only findings on opportunities they own", () => {
  assert.match(migration, /actor_role <> 'member'/);
  assert.match(migration, /opportunity\.owner_profile_id = actor_profile_id/);
});

test("CI22-09 superseded findings cannot be human-resolved", () => {
  assert.match(migration, /finding_row\.state = 'superseded'/);
  assert.match(migration, /finding_no_longer_active/);
});

test("CI22-10 row-version compare-and-set is mandatory", () => {
  assert.match(migration, /finding_row\.row_version <> expected_row_version/);
  assert.match(migration, /row_version = row_version \+ 1/);
  assert.match(migration, /and row_version = expected_row_version/);
});

test("CI22-11 finding fingerprint compare-and-set is mandatory", () => {
  assert.match(migration, /finding_row\.finding_key <> btrim\(expected_finding_key\)/);
  assert.match(migration, /and finding_key = btrim\(expected_finding_key\)/);
});

test("CI22-12 dismissal requires an explicit human note", () => {
  assert.match(migration, /target_reason = 'dismissed_with_reason'/);
  assert.match(migration, /dismissal requires a reason/);
});

test("CI22-13 human decision stores actor, reason and timestamp", () => {
  assert.match(migration, /resolution_reason = target_reason/);
  assert.match(migration, /resolved_by_profile_id = actor_profile_id/);
  assert.match(migration, /resolved_at = now\(\)/);
});

test("CI22-14 human decision creates an audit event", () => {
  assert.match(migration, /'resolution_recorded'/);
  assert.match(migration, /actor_profile_id,[\s\S]*reason_code,[\s\S]*note/);
});

test("CI22-15 resolution RPC never mutates CRM, opportunity association or providers", () => {
  assert.doesNotMatch(
    migration,
    /update public\.opportunities|update public\.crm_|external_document_sources\s+set|google|gmail/
  );
});

test("CI22-16 server action re-evaluates deterministic truth before decision", () => {
  assert.match(action, /getCommercialTruthForOpportunity/);
  assert.match(action, /const currentFinding = truth\.contextIntegrity\?\.findings\.find/);
});

test("CI22-17 action requires the exact finding to remain active", () => {
  assert.match(action, /finding\.key === validated\.expectedFindingKey/);
  assert.match(action, /Contextul s-a schimbat/);
});

test("CI22-18 action checks persisted row version before RPC", () => {
  assert.match(action, /currentCase\.rowVersion !== validated\.expectedRowVersion/);
});

test("CI22-19 action uses authenticated Supabase client, never admin", () => {
  assert.match(action, /createSupabaseServerClient/);
  assert.doesNotMatch(action, /createSupabaseAdminClient|service_role/i);
});

test("CI22-20 action invokes only the dedicated human resolution RPC", () => {
  assert.match(action, /\.rpc\(\s*"resolve_context_integrity_finding_v1"/);
  assert.doesNotMatch(action, /\.from\(/);
});

test("CI22-21 action never claims success for malformed RPC responses", () => {
  assert.match(action, /payload\.status !== "resolved"/);
  assert.match(action, /Răspunsul de salvare nu este valid/);
});

test("CI22-22 UI offers four understandable decision choices", () => {
  for (const label of [
    "Păstrează contextul CRM",
    "Documentul aparține altui context",
    "Documentul este istoric",
    "Constatarea nu se aplică"
  ]) {
    assert.match(strip, new RegExp(label));
  }
});

test("CI22-23 UI explicitly states that documents are not moved automatically", () => {
  assert.match(strip, /nu muți sau să reasociezi automat documentul/i);
  assert.match(strip, /Fără modificare automată/);
});

test("CI22-24 UI requires a note for dismissal", () => {
  assert.match(strip, /dismissed_with_reason/);
  assert.match(strip, /note\.trim\(\)\.length < 3/);
});

test("CI22-25 UI calls the human decision a recorded decision, not an autonomous fix", () => {
  assert.match(strip, /Consemnează decizia/);
  assert.match(strip, /Decizie consemnată/);
});

test("CI22-26 reviewed findings can be revised by a human", () => {
  assert.match(strip, /Modifică decizia/);
});

test("CI22-27 reviewed exact CI issues are removed from generic discrepancy counts", () => {
  assert.match(snapshot, /reviewedIntegrityKeys/);
  assert.match(snapshot, /visibleIssues/);
});

test("CI22-28 reviewed CI issues are removed from the generic issue detail list", () => {
  assert.match(snapshot, /visibleIssues\.slice\(0,4\)/);
});

test("CI22-29 executive hero ignores already-reviewed exact CI findings", () => {
  assert.match(conversation, /reviewedIntegrityKeys/);
  assert.match(conversation, /visibleTruthIssues/);
});

test("CI22-30 resolution UI stays compact and responsive", () => {
  assert.match(stripCss, /CONTEXT_INTEGRITY_HUMAN_RESOLUTION_V1/);
  assert.match(stripCss, /@media \(max-width: 560px\)/);
  assert.doesNotMatch(stripCss, /overflow-x:\s*auto/);
});
