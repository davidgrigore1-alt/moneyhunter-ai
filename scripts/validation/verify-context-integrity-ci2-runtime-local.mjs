import crypto from "node:crypto";
import { createLocalAdminClient, runLocalSql } from "../demo/local-supabase.mjs";

const token = crypto.randomUUID();
const caseKey = `ci2-runtime-verifier:${token}`;
const findingKey1 = `ci2-finding:${token}:1`;
const findingKey2 = `ci2-finding:${token}:2`;

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

  if (business.error || !business.data?.id) fail("Meridian workspace indisponibil.");

  const opportunity = await client
    .from("opportunities")
    .select("id")
    .eq("business_id", business.data.id)
    .eq("title", "Program servicii corporate · Nova Medical")
    .limit(1)
    .maybeSingle();

  if (opportunity.error || !opportunity.data?.id) fail("Golden opportunity indisponibilă.");

  const base = {
    lifecycleVersion: "context-integrity-lifecycle/1",
    contractVersion: "context-integrity/0",
    caseKey,
    findingKey: findingKey1,
    visibilityScope: "business",
    ownerProfileId: null,
    kind: "source_association_mismatch",
    subjectType: "opportunity",
    subjectId: opportunity.data.id,
    field: "customer_identity",
    severity: "high",
    evidenceStrength: "structured",
    reasonCode: "different_value_same_comparable_context",
    safeAction: "review_association",
    canonicalObservationId: `ci:crm:${opportunity.data.id}:customer_identity`,
    conflictingObservationIds: [`ci:test:${token}`],
    evidenceRefs: [
      {
        sourceType: "opportunity",
        sourceId: opportunity.data.id,
        sourceRevision: null,
        sourceDocumentId: null,
        sourceSegmentId: null,
        title: "Golden opportunity",
        sourceLocation: null,
        occurredAt: null,
        provider: null
      }
    ]
  };

  const call = async (coverage, findings, evaluatedAt) => {
    const result = await client.rpc("reconcile_context_integrity_v1", {
      target_business_id: business.data.id,
      target_opportunity_id: opportunity.data.id,
      target_evaluated_at: evaluatedAt,
      target_coverage_status: coverage,
      detected_findings: findings
    });
    if (result.error) fail(`RPC failed: ${result.error.code ?? "unknown"} ${result.error.message ?? ""}`);
    return result.data;
  };

  const first = await call("complete", [base], "2026-09-10T13:00:00.000Z");
  if (first?.created !== 1) fail("Prima detecție nu a creat exact un caz.");

  const second = await call("complete", [base], "2026-09-10T13:01:00.000Z");
  if (second?.observed !== 1) fail("A doua detecție identică nu a fost observată idempotent.");

  const secondCase = second?.cases?.find((item) => item.case_key === caseKey);
  if (!secondCase || secondCase.row_version !== 1 || secondCase.detection_count !== 2) {
    fail("Observarea identică a schimbat versiunea sau nu a incrementat detection_count.");
  }

  const changed = await call(
    "complete",
    [{ ...base, findingKey: findingKey2 }],
    "2026-09-10T13:02:00.000Z"
  );
  const changedCase = changed?.cases?.find((item) => item.case_key === caseKey);
  if (changed?.changed !== 1 || !changedCase || changedCase.row_version !== 2) {
    fail("Finding-ul schimbat nu a incrementat row_version.");
  }

  const held = await call("partial", [], "2026-09-10T13:03:00.000Z");
  const heldCase = held?.cases?.find((item) => item.case_key === caseKey);
  if (held?.held < 1 || heldCase?.state !== "needs_review") {
    fail("Coverage parțial a închis incorect cazul.");
  }

  const superseded = await call("complete", [], "2026-09-10T13:04:00.000Z");
  const supersededCase = superseded?.cases?.find((item) => item.case_key === caseKey);
  if (superseded?.superseded !== 1 || supersededCase?.state !== "superseded") {
    fail("Coverage complet nu a supersedat cazul absent.");
  }

  const reopened = await call(
    "complete",
    [{ ...base, findingKey: findingKey2 }],
    "2026-09-10T13:05:00.000Z"
  );
  const reopenedCase = reopened?.cases?.find((item) => item.case_key === caseKey);
  if (reopened?.reopened !== 1 || reopenedCase?.state !== "needs_review" || reopenedCase.row_version !== 4) {
    fail("Reapariția aceluiași finding după supersede nu a redeschis cazul.");
  }

  const audit = runLocalSql(`
    select json_build_object(
      'case_count', (
        select count(*) from public.context_integrity_findings
        where case_key = '${caseKey.replaceAll("'", "''")}'
      ),
      'event_count', (
        select count(*) from public.context_integrity_finding_events event
        join public.context_integrity_findings finding on finding.id = event.finding_id
        where finding.case_key = '${caseKey.replaceAll("'", "''")}'
      )
    );
  `);

  if (!/"case_count"\s*:\s*1/.test(audit)) fail("Verifierul a creat duplicate pentru același caseKey.");
  if (!/"event_count"\s*:\s*5/.test(audit)) fail("Audit trail-ul nu conține cele cinci evenimente persistate așteptate.");

  console.log("PASS: Context Integrity CI-2.1 local reconciliation runtime.");
  console.log("- same case persisted once");
  console.log("- identical finding observed without row-version churn");
  console.log("- changed finding increments row version");
  console.log("- partial coverage holds fail-closed");
  console.log("- complete coverage supersedes absent pending case");
  console.log("- reappearance after supersede reopens review");
  console.log("- audit events retained");
  console.log("- no source body or secret printed");
} catch (error) {
  console.error("FAIL:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  try {
    runLocalSql(`
      delete from public.context_integrity_finding_events
      where finding_id in (
        select id from public.context_integrity_findings
        where case_key = '${caseKey.replaceAll("'", "''")}'
      );
      delete from public.context_integrity_findings
      where case_key = '${caseKey.replaceAll("'", "''")}';
    `);
  } catch {
    // Best-effort cleanup only. Never hide the verifier result.
  }
}
