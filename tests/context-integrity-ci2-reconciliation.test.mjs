import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lifecycle = fs.readFileSync("src/lib/context-integrity/lifecycle.ts", "utf8");
const repository = fs.readFileSync("src/lib/context-integrity/repository.ts", "utf8");
const truthServer = fs.readFileSync("src/lib/commercial-truth-server.ts", "utf8");
const truth = fs.readFileSync("src/lib/commercial-truth.ts", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260910161000_context_integrity_reconciliation_runtime.sql",
  "utf8"
).toLowerCase();

test("CI21-01 repository uses server-only admin client", () => {
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /createSupabaseAdminClient/);
});

test("CI21-02 repository serializes deterministic snapshots through CI-2 lifecycle", () => {
  assert.match(repository, /toContextIntegrityPersistentSnapshot/);
  assert.match(repository, /evaluation\.findings\.map/);
});

test("CI21-03 repository sends no source body fields", () => {
  assert.doesNotMatch(repository, /\bexcerpt\b|\bbody\b|raw_source_text|segment\.text/i);
});

test("CI21-04 repository calls one bounded atomic RPC", () => {
  assert.match(repository, /\.rpc\("reconcile_context_integrity_v1"/);
  assert.doesNotMatch(repository, /\.insert\(|\.update\(|\.delete\(/);
});

test("CI21-05 persistence result is typed for future human review UX", () => {
  assert.match(lifecycle, /ContextIntegrityPersistenceCase/);
  assert.match(lifecycle, /ContextIntegrityPersistenceResult/);
  assert.match(lifecycle, /rowVersion/);
  assert.match(lifecycle, /resolutionReason/);
});

test("CI21-06 superseded same-fingerprint cases reopen instead of remaining invisible", () => {
  assert.match(lifecycle, /current\.state !== "superseded"/);
});

test("CI21-07 commercial truth exposes persistence status without replacing deterministic evaluation", () => {
  assert.match(truth, /contextIntegrityPersistence/);
  assert.match(truth, /contextIntegrity\?:ContextIntegrityEvaluation/);
});

test("CI21-08 server reconciles only after deterministic truth assembly", () => {
  const assembleIndex = truthServer.indexOf(
    "const truth=assembleCommercialTruth"
  );
  const reconcileCallIndex = truthServer.indexOf(
    "const contextIntegrityPersistence=await reconcileContextIntegrityForOpportunity"
  );

  assert.ok(assembleIndex >= 0, "deterministic truth assembly is missing");
  assert.ok(
    reconcileCallIndex > assembleIndex,
    "persistence reconciliation must run after deterministic truth assembly"
  );
});

test("CI21-09 persistence failure does not fabricate a successful save", () => {
  assert.match(repository, /status: "unavailable"/);
  assert.match(repository, /reconcile_failed:/);
});

test("CI21-10 persistence failure is surfaced as a limitation", () => {
  assert.match(truthServer, /context_integrity_persistence_unavailable/);
});

test("CI21-11 reconciliation RPC is service-role only", () => {
  assert.match(migration, /revoke all on function public\.reconcile_context_integrity_v1[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.reconcile_context_integrity_v1[\s\S]*to service_role/);
});

test("CI21-12 RPC validates opportunity belongs to tenant", () => {
  assert.match(migration, /opportunity\.business_id = target_business_id/);
  assert.match(migration, /context integrity opportunity scope unavailable/);
});

test("CI21-13 RPC rejects more than 32 findings", () => {
  assert.match(migration, /jsonb_array_length\(detected_findings\) > 32/);
});

test("CI21-14 RPC rejects duplicate case keys", () => {
  assert.match(migration, /duplicate context integrity case key/);
  assert.match(migration, /group by element->>'casekey'/);
});

test("CI21-15 RPC validates owner-private scope", () => {
  assert.match(migration, /private visibility requires owner profile/);
  assert.match(migration, /business visibility cannot carry owner profile/);
});

test("CI21-16 RPC allowlists evidence metadata keys", () => {
  assert.match(migration, /context integrity evidence refs contain disallowed fields/);
  assert.match(migration, /'sourcetype','sourceid','sourcerevision','sourcedocumentid'/);
});

test("CI21-17 new logical cases are persisted as needs_review", () => {
  assert.match(migration, /'needs_review',\s*1,\s*1,/);
  assert.match(migration, /'detected'/);
});

test("CI21-18 same exact finding preserves row version and human state", () => {
  assert.match(migration, /existing_row\.finding_key = finding_key_value[\s\S]*existing_row\.state <> 'superseded'/);
  const observedBlock = migration.match(/if existing_row\.finding_key = finding_key_value[\s\S]*?continue;/)?.[0] ?? "";
  assert.doesNotMatch(observedBlock, /row_version = row_version \+ 1/);
  assert.match(observedBlock, /detection_count = detection_count \+ 1/);
});

test("CI21-19 changed pending finding increments compare-and-set version", () => {
  assert.match(migration, /row_version = row_version \+ 1/);
  assert.match(migration, /event_kind := 'changed'/);
});

test("CI21-20 changed resolved/dismissed/superseded finding reopens", () => {
  assert.match(migration, /existing_row\.state in \('resolved','dismissed','superseded'\)/);
  assert.match(migration, /event_kind := 'reopened'/);
  assert.match(migration, /resolution_reason = null/);
});

test("CI21-21 complete coverage supersedes missing pending findings", () => {
  assert.match(migration, /if target_coverage_status = 'complete'/);
  assert.match(migration, /state = 'superseded'/);
});

test("CI21-22 incomplete coverage holds missing pending findings", () => {
  assert.match(migration, /into count_held/);
  assert.doesNotMatch(
    migration.match(/else\s+select count\(\*\)::integer[\s\S]*?end if;/)?.[0] ?? "",
    /state = 'superseded'/
  );
});

test("CI21-23 system detection events never impersonate a human actor", () => {
  assert.match(migration, /'detected',[\s\S]*?null,[\s\S]*?existing_row\.case_key/);
  assert.match(migration, /'observed',[\s\S]*?null,[\s\S]*?existing_row\.case_key/);
});

test("CI21-24 RPC returns minimal cases for future UI", () => {
  assert.match(migration, /'case_key', finding\.case_key/);
  assert.match(migration, /'row_version', finding\.row_version/);
  assert.match(migration, /'resolution_reason', finding\.resolution_reason/);
});

test("CI21-25 reconciliation migration performs no provider or CRM mutation", () => {
  assert.doesNotMatch(migration, /external_document_sources\s+set|crm_organizations\s+set|opportunities\s+set\s+organization_id/);
});

test("CI21-26 no authenticated execute grant exists for reconciliation", () => {
  assert.doesNotMatch(migration, /grant execute[\s\S]*to authenticated/);
});
