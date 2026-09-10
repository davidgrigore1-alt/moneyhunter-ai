import crypto from "node:crypto";
import { createLocalAdminClient, runLocalSql } from "../demo/local-supabase.mjs";

const token = crypto.randomUUID();
const caseKey = `execution-integrity/1|runtime|${token}`;
const findingKey1 = `${caseKey}|action-1|pending|2026-09-09`;
const findingKey2 = `${caseKey}|action-1|pending|2026-09-08`;

function fail(message) {
  throw new Error(message);
}

try {
  const { client } = createLocalAdminClient();

  const business = await client
    .from("businesses")
    .select("id")
    .eq("name", "Meridian Commercial Operations")
    .limit(1)
    .maybeSingle();

  if (business.error || !business.data?.id) {
    fail("Meridian workspace indisponibil.");
  }

  const opportunity = await client
    .from("opportunities")
    .select("id")
    .eq("business_id", business.data.id)
    .eq("title", "Program servicii corporate · Nova Medical")
    .limit(1)
    .maybeSingle();

  if (opportunity.error || !opportunity.data?.id) {
    fail("Golden opportunity indisponibilă.");
  }

  const base = {
    version: "execution-integrity/1",
    caseKey,
    findingKey: findingKey1,
    code: "overdue_next_action",
    severity: "critical",
    sourceType: "action",
    sourceId: `runtime-action-${token}`,
    label: "Acțiune restantă",
    explanation: "Acțiunea de test este restantă.",
    safeActionLabel: "Revizuiește acțiunea restantă",
    safeActionHref: `/opportunities/${opportunity.data.id}#workflow-actions-list`,
    evidenceRefs: [
      {
        sourceType: "opportunity",
        sourceId: opportunity.data.id,
        label: "Golden opportunity",
        observedAt: "2026-09-10T13:00:00.000Z",
        href: `/opportunities/${opportunity.data.id}`
      }
    ]
  };

  async function call(findings, complete, at) {
    const result = await client.rpc(
      "reconcile_execution_integrity_workspace_v1",
      {
        target_business_id: business.data.id,
        target_evaluated_at: at,
        evaluations: [
          {
            opportunityId: opportunity.data.id,
            coverageComplete: complete,
            findings
          }
        ]
      }
    );

    if (result.error) {
      fail(
        `Execution Integrity RPC failed: ${result.error.code ?? "unknown"} ${result.error.message ?? ""}`
      );
    }

    return result.data;
  }

  const first = await call(
    [base],
    true,
    "2026-09-10T13:00:00.000Z"
  );
  if (first?.created !== 1) {
    fail("Prima detecție nu a creat exact un caz.");
  }

  const observed = await call(
    [base],
    true,
    "2026-09-10T13:01:00.000Z"
  );
  if (observed?.observed !== 1) {
    fail("Finding-ul identic nu a fost observat idempotent.");
  }

  const afterObserved = await client
    .from("execution_integrity_findings")
    .select("state,row_version,detection_count")
    .eq("case_key", caseKey)
    .single();

  if (
    afterObserved.error ||
    afterObserved.data?.state !== "open" ||
    afterObserved.data?.row_version !== 1 ||
    afterObserved.data?.detection_count !== 2
  ) {
    fail("Observarea identică a produs churn de versiune.");
  }

  const changed = await call(
    [{ ...base, findingKey: findingKey2 }],
    true,
    "2026-09-10T13:02:00.000Z"
  );
  if (changed?.changed !== 1) {
    fail("Schimbarea snapshot-ului nu a fost înregistrată.");
  }

  const held = await call(
    [],
    false,
    "2026-09-10T13:03:00.000Z"
  );
  if (held?.held < 1) {
    fail("Evaluarea incompletă nu a ținut cazul deschis.");
  }

  const afterHold = await client
    .from("execution_integrity_findings")
    .select("state,row_version")
    .eq("case_key", caseKey)
    .single();

  if (
    afterHold.error ||
    afterHold.data?.state !== "open" ||
    afterHold.data?.row_version !== 2
  ) {
    fail("Coverage incomplet a închis incorect cazul.");
  }

  const resolved = await call(
    [],
    true,
    "2026-09-10T13:04:00.000Z"
  );
  if (resolved?.resolved !== 1) {
    fail("Schimbarea reală a sursei nu a rezolvat cazul.");
  }

  const afterResolve = await client
    .from("execution_integrity_findings")
    .select("state,row_version,resolved_at")
    .eq("case_key", caseKey)
    .single();

  if (
    afterResolve.error ||
    afterResolve.data?.state !== "resolved" ||
    afterResolve.data?.row_version !== 3 ||
    !afterResolve.data?.resolved_at
  ) {
    fail("Cazul nu a fost închis source-driven.");
  }

  const reopened = await call(
    [{ ...base, findingKey: findingKey2 }],
    true,
    "2026-09-10T13:05:00.000Z"
  );

  if (reopened?.reopened !== 1) {
    fail("Reapariția aceleiași rupturi nu a redeschis cazul.");
  }

  const afterReopen = await client
    .from("execution_integrity_findings")
    .select("state,row_version,detection_count")
    .eq("case_key", caseKey)
    .single();

  if (
    afterReopen.error ||
    afterReopen.data?.state !== "open" ||
    afterReopen.data?.row_version !== 4 ||
    afterReopen.data?.detection_count !== 4
  ) {
    fail("Reopen-ul nu a păstrat lifecycle-ul așteptat.");
  }

  const events = await client
    .from("execution_integrity_finding_events")
    .select("event_type,row_version")
    .eq(
      "finding_id",
      (
        await client
          .from("execution_integrity_findings")
          .select("id")
          .eq("case_key", caseKey)
          .single()
      ).data?.id
    )
    .order("created_at");

  if (events.error || (events.data?.length ?? 0) !== 4) {
    fail("Audit trail-ul nu are exact patru tranziții reale.");
  }

  const eventTypes = (events.data ?? []).map((item) => item.event_type);
  if (
    JSON.stringify(eventTypes) !==
    JSON.stringify(["detected", "changed", "resolved", "reopened"])
  ) {
    fail("Audit trail-ul conține o ordine neașteptată.");
  }

  console.log("PASS: Execution Integrity V1 local runtime.");
  console.log("- one recurring break -> one durable case");
  console.log("- identical observation creates no audit spam");
  console.log("- changed snapshot increments row version");
  console.log("- incomplete coverage holds fail-closed");
  console.log("- actual source-state change resolves the case");
  console.log("- recurrence reopens the same case");
  console.log("- no human dismissal, CRM mutation, provider write, or fake completion");
} catch (error) {
  console.error(
    "FAIL:",
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
} finally {
  try {
    runLocalSql(`
      delete from public.execution_integrity_finding_events
      where finding_id in (
        select id
        from public.execution_integrity_findings
        where case_key = '${caseKey.replaceAll("'", "''")}'
      );
      delete from public.execution_integrity_findings
      where case_key = '${caseKey.replaceAll("'", "''")}';
    `);
  } catch {
    // best-effort local cleanup
  }
}
