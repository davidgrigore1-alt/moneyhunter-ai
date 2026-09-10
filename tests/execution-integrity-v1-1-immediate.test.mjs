import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const immediate = fs.readFileSync(
  "src/lib/execution-integrity/immediate.ts",
  "utf8"
);
const workspaceActions = fs.readFileSync(
  "src/lib/revenue-workspace/actions.ts",
  "utf8"
);
const responseActions = fs.readFileSync(
  "src/lib/commercial-response-actions.ts",
  "utf8"
);
const inboxActions = fs.readFileSync(
  "src/lib/commercial-inbox-actions.ts",
  "utf8"
);
const taskControls = fs.readFileSync(
  "src/components/revenue/TaskControls.tsx",
  "utf8"
);
const opportunityControls = fs.readFileSync(
  "src/components/opportunities/OpportunityControlCenter.tsx",
  "utf8"
);

test("EI11-01 immediate helper is server-only", () => {
  assert.match(immediate, /^import "server-only";/);
});

test("EI11-02 immediate helper reloads the opportunity after the mutation", () => {
  assert.match(immediate, /getOpportunityForCurrentBusiness\(safeOpportunityId\)/);
});

test("EI11-03 immediate helper derives current business scope on the server", () => {
  assert.match(immediate, /getCurrentBusinessOrDemo\(\{ redirectIfMissing: true \}\)/);
});

test("EI11-04 tenant mismatch fails closed", () => {
  assert.match(immediate, /opportunity\.businessId !== business\.id/);
  assert.match(immediate, /scope_mismatch/);
});

test("EI11-05 linked commercial signals are freshly loaded", () => {
  assert.match(immediate, /getCommercialSignalsForOpportunity\(safeOpportunityId\)/);
});

test("EI11-06 commercial state is rebuilt deterministically", () => {
  assert.match(immediate, /buildOpportunityCommercialState\(opportunity/);
  assert.match(immediate, /businessId: business\.id/);
  assert.match(immediate, /linkedSignals/);
});

test("EI11-07 execution findings are rebuilt from fresh state", () => {
  assert.match(immediate, /buildExecutionIntegrityFindings\(state\)/);
});

test("EI11-08 immediate reconciliation is opportunity-scoped", () => {
  assert.match(immediate, /reconcileExecutionIntegrityWorkspace/);
  assert.match(immediate, /opportunityId: safeOpportunityId/);
});

test("EI11-09 complete coverage is asserted only after all fresh reads succeed", () => {
  const build = immediate.indexOf("buildExecutionIntegrityFindings(state)");
  const complete = immediate.indexOf("coverageComplete: true");
  assert.ok(build >= 0 && complete > build);
});

test("EI11-10 evaluation failure returns unavailable instead of throwing into the mutation", () => {
  assert.match(immediate, /catch \(error\)/);
  assert.match(immediate, /return unavailable\(safeOpportunityId, "evaluation_failed"\)/);
});

test("EI11-11 logs contain only safe error class metadata", () => {
  assert.match(immediate, /error instanceof Error \? error\.name : "unknown"/);
  assert.doesNotMatch(immediate, /error\.message|JSON\.stringify\(error\)/);
});

test("EI11-12 route invalidation occurs after the reconciliation attempt", () => {
  const reconcile = immediate.indexOf("reconcileExecutionIntegrityWorkspace");
  const invalidate = immediate.lastIndexOf("revalidateCommercialState");
  assert.ok(reconcile >= 0 && invalidate > reconcile);
});

test("EI11-13 route invalidation itself cannot fail the original business mutation", () => {
  assert.match(
    immediate,
    /try \{\s*revalidateCommercialState\(safeOpportunityId\);\s*\} catch/
  );
});

test("EI11-14 helper has no provider or model calls", () => {
  assert.doesNotMatch(
    immediate,
    /openai|googleapis|gmail|calendar\.events|drive\.files|fetch\s*\(/i
  );
});

test("EI11-15 helper does not mutate opportunities, actions, signals or documents", () => {
  assert.doesNotMatch(
    immediate,
    /\.from\("opportunities"\)|\.from\("opportunity_actions"\)|\.from\("commercial_signals"\)|\.from\("opportunity_documents"\)|\.update\(|\.insert\(|\.delete\(/
  );
});

test("EI11-16 workspace action finalizer now awaits immediate EI reconciliation", () => {
  assert.match(
    workspaceActions,
    /async function revalidateOpportunity\(opportunityId: string\) \{\s*await reevaluateExecutionIntegrityAfterMutation\(opportunityId\);\s*\}/
  );
});

test("EI11-17 all six successful first-party opportunity mutation paths await finalization", () => {
  assert.equal(
    (workspaceActions.match(/await revalidateOpportunity\(opportunityId\);/g) ?? []).length,
    6
  );
});

test("EI11-18 task creation is one of the immediately re-evaluated paths", () => {
  const start = workspaceActions.indexOf("export async function createOpportunityTask");
  const end = workspaceActions.indexOf("export async function completeOpportunityTask");
  const block = workspaceActions.slice(start, end);
  assert.match(block, /await revalidateOpportunity\(opportunityId\)/);
});

test("EI11-19 task completion is one of the immediately re-evaluated paths", () => {
  const start = workspaceActions.indexOf("export async function completeOpportunityTask");
  const end = workspaceActions.indexOf("async function verifyAssignableProfile");
  const block = workspaceActions.slice(start, end);
  assert.match(block, /await revalidateOpportunity\(opportunityId\)/);
});

test("EI11-20 owner assignment is immediately re-evaluated", () => {
  const start = workspaceActions.indexOf("export async function updateOpportunityCommercialDetails");
  const end = workspaceActions.indexOf("function validMoney");
  const block = workspaceActions.slice(start, end);
  assert.match(block, /await revalidateOpportunity\(opportunityId\)/);
});

test("EI11-21 lifecycle close and reopen are immediately re-evaluated", () => {
  const outcome = workspaceActions.slice(
    workspaceActions.indexOf("export async function recordOpportunityOutcome"),
    workspaceActions.indexOf("export async function reopenOpportunity")
  );
  const reopen = workspaceActions.slice(
    workspaceActions.indexOf("export async function reopenOpportunity")
  );
  assert.match(outcome, /await revalidateOpportunity\(opportunityId\)/);
  assert.match(reopen, /await revalidateOpportunity\(opportunityId\)/);
});

test("EI11-22 recording a commercial response re-evaluates after creating its next action", () => {
  const reconcile = responseActions.indexOf(
    "await reevaluateExecutionIntegrityAfterMutation(opportunityId)"
  );
  const actionInsert = responseActions.indexOf(
    '.from("opportunity_actions").insert'
  );
  assert.ok(actionInsert >= 0 && reconcile > actionInsert);
});

test("EI11-23 response flow keeps existing broad route refresh after EI persistence", () => {
  const reconcile = responseActions.indexOf(
    "await reevaluateExecutionIntegrityAfterMutation(opportunityId)"
  );
  const refresh = responseActions.lastIndexOf("refresh(opportunityId)");
  assert.ok(reconcile >= 0 && refresh > reconcile);
});

test("EI11-24 signal result opportunity ids are structurally derived, never trusted from browser input", () => {
  assert.match(inboxActions, /linkedOpportunityIdFromMutation\(result: unknown\)/);
  assert.match(inboxActions, /row\.opportunityId/);
  assert.match(inboxActions, /row\.signal\?\.convertedOpportunityId/);
  assert.match(inboxActions, /row\.signal\?\.detectedFromOpportunityId/);
});

test("EI11-25 failed signal mutations never trigger an execution reconciliation", () => {
  assert.match(inboxActions, /if \(row\.ok !== true\) return null/);
});

test("EI11-26 analyzed linked signals can immediately create pending-approval execution state", () => {
  const start = inboxActions.indexOf("export async function analyzeCommercialSignal");
  const end = inboxActions.indexOf("export async function approveCommercialSignal");
  const block = inboxActions.slice(start, end);
  assert.match(block, /settleSignalExecutionIntegrity\(result\)/);
});

test("EI11-27 approve and reject signal paths immediately re-evaluate linked opportunities", () => {
  const approve = inboxActions.slice(
    inboxActions.indexOf("export async function approveCommercialSignal"),
    inboxActions.indexOf("export async function setCommercialSignalReviewDecision")
  );
  const reject = inboxActions.slice(
    inboxActions.indexOf("export async function rejectCommercialSignal"),
    inboxActions.indexOf("export async function updateCommercialSignal")
  );
  assert.match(approve, /settleSignalExecutionIntegrity\(result\)/);
  assert.match(reject, /settleSignalExecutionIntegrity\(result\)/);
});

test("EI11-28 ignore/archive/review-decision signal paths also settle pending approval state", () => {
  for (const name of [
    "setCommercialSignalReviewDecision",
    "ignoreCommercialSignal",
    "archiveCommercialSignal"
  ]) {
    const start = inboxActions.indexOf(`export async function ${name}`);
    assert.ok(start >= 0);
    const next = inboxActions.indexOf("\nexport async function ", start + 10);
    const block = inboxActions.slice(start, next >= 0 ? next : undefined);
    assert.match(block, /settleSignalExecutionIntegrity\(result\)/);
  }
});

test("EI11-29 convert signal path immediately evaluates the new or linked opportunity", () => {
  const start = inboxActions.indexOf("export async function convertSignalToOpportunity");
  const end = inboxActions.indexOf("export async function addCommercialSignalEvent");
  const block = inboxActions.slice(start, end);
  assert.match(block, /settleSignalExecutionIntegrity\(result\)/);
});

test("EI11-30 existing task UI still refreshes after successful server actions", () => {
  assert.match(taskControls, /router\.refresh\(\)/);
});

test("EI11-31 existing opportunity control UI still refreshes after successful server actions", () => {
  assert.match(opportunityControls, /router\.refresh\(\)/);
});

test("EI11-32 V1.1 introduces no human execution-dismissal control", () => {
  assert.doesNotMatch(
    immediate + workspaceActions + responseActions + inboxActions,
    /dismissExecutionIntegrity|markExecutionIntegrityResolved|resolveExecutionIntegrityFinding/
  );
});

test("EI11-33 V1.1 does not alter external communication safety", () => {
  assert.doesNotMatch(
    immediate,
    /sendEmail|messages\.send|gmail.*send|providerWrite/i
  );
});

test("EI11-34 V1.1 adds no new dashboard or route", () => {
  assert.equal(
    fs.existsSync("src/app/(protected)/execution-integrity/page.tsx"),
    false
  );
});

test("EI11-35 immediate helper returns active finding count only after persistence succeeds", () => {
  assert.match(
    immediate,
    /reconciled\.status === "saved" \? findings\.length : 0/
  );
});

test("EI11-36 no migration is added for V1.1", () => {
  const migrationNames = fs
    .readdirSync("supabase/migrations")
    .filter((name) => name.includes("execution_integrity_v1_1"));
  assert.equal(migrationNames.length, 0);
});
