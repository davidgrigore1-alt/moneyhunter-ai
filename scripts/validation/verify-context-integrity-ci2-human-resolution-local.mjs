import crypto from "node:crypto";
import { createLocalAdminClient, runLocalSql } from "../demo/local-supabase.mjs";

const token = crypto.randomUUID();
const caseKey = `ci22-human:${token}`;
const findingKey = `ci22-finding:${token}`;

function fail(message) {
  throw new Error(message);
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

try {
  const { client } = createLocalAdminClient();

  const business = await client
    .from("businesses")
    .select("id,owner_profile_id")
    .eq("name", "Meridian Commercial Operations")
    .limit(1)
    .maybeSingle();

  if (business.error || !business.data?.id || !business.data.owner_profile_id) {
    fail("Meridian workspace owner indisponibil.");
  }

  const profile = await client
    .from("profiles")
    .select("id,user_id")
    .eq("id", business.data.owner_profile_id)
    .limit(1)
    .maybeSingle();

  if (profile.error || !profile.data?.user_id) {
    fail("Auth identity pentru workspace owner indisponibilă.");
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

  const inserted = await client
    .from("context_integrity_findings")
    .insert({
      business_id: business.data.id,
      opportunity_id: opportunity.data.id,
      lifecycle_version: "context-integrity-lifecycle/1",
      contract_version: "context-integrity/0",
      case_key: caseKey,
      finding_key: findingKey,
      visibility_scope: "business",
      owner_profile_id: null,
      kind: "source_association_mismatch",
      subject_type: "opportunity",
      subject_id: opportunity.data.id,
      field: "customer_identity",
      severity: "high",
      evidence_strength: "structured",
      reason_code: "different_value_same_comparable_context",
      safe_action: "review_association",
      canonical_observation_id: `ci:crm:${opportunity.data.id}:customer_identity`,
      conflicting_observation_ids: [`ci:test:${token}`],
      evidence_refs: [
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
      ],
      state: "needs_review",
      row_version: 1,
      detection_count: 1
    })
    .select("id,row_version,finding_key")
    .single();

  if (inserted.error || !inserted.data?.id) {
    fail(`Nu am putut crea finding-ul temporar: ${inserted.error?.message ?? "unknown"}`);
  }

  const findingId = inserted.data.id;
  const authUserId = profile.data.user_id;

  function callAsOwner(version, key, reason, note) {
    const noteSql = note == null ? "null" : sqlLiteral(note);
    return runLocalSql(`
      begin;
      select set_config('request.jwt.claim.sub', ${sqlLiteral(authUserId)}, true);
      select set_config(
        'request.jwt.claims',
        json_build_object('sub', ${sqlLiteral(authUserId)}, 'role', 'authenticated')::text,
        true
      );
      set local role authenticated;
      select public.resolve_context_integrity_finding_v1(
        ${sqlLiteral(findingId)}::uuid,
        ${Number(version)}::integer,
        ${sqlLiteral(key)}::text,
        ${sqlLiteral(reason)}::text,
        ${noteSql}::text
      )::text;
      commit;
    `);
  }

  const staleVersion = callAsOwner(
    99,
    findingKey,
    "source_belongs_elsewhere",
    "Document pentru alt context."
  );
  if (!/"status"\s*:\s*"conflict"/.test(staleVersion) || !/stale_version/.test(staleVersion)) {
    fail("Stale row version nu a fost respins.");
  }

  const staleKey = callAsOwner(
    1,
    `${findingKey}:stale`,
    "source_belongs_elsewhere",
    "Document pentru alt context."
  );
  if (!/"status"\s*:\s*"conflict"/.test(staleKey) || !/finding_changed/.test(staleKey)) {
    fail("Stale finding key nu a fost respins.");
  }

  const resolved = callAsOwner(
    1,
    findingKey,
    "source_belongs_elsewhere",
    "Documentul aparține altui context comercial."
  );
  if (!/"status"\s*:\s*"resolved"/.test(resolved) || !/"state"\s*:\s*"resolved"/.test(resolved)) {
    fail("Decizia umană validă nu a fost salvată.");
  }

  const rowAfterResolve = await client
    .from("context_integrity_findings")
    .select("state,row_version,resolution_reason,resolved_by_profile_id,resolved_at")
    .eq("id", findingId)
    .single();

  if (
    rowAfterResolve.error ||
    rowAfterResolve.data?.state !== "resolved" ||
    rowAfterResolve.data?.row_version !== 2 ||
    rowAfterResolve.data?.resolution_reason !== "source_belongs_elsewhere" ||
    rowAfterResolve.data?.resolved_by_profile_id !== profile.data.id ||
    !rowAfterResolve.data?.resolved_at
  ) {
    fail("Finding-ul nu conține actorul, motivul și versiunea așteptate.");
  }

  const revised = callAsOwner(
    2,
    findingKey,
    "dismissed_with_reason",
    "Context verificat manual; finding-ul nu se aplică."
  );
  if (!/"status"\s*:\s*"resolved"/.test(revised) || !/"state"\s*:\s*"dismissed"/.test(revised)) {
    fail("Modificarea unei decizii umane nu a fost auditată corect.");
  }

  const audit = await client
    .from("context_integrity_finding_events")
    .select("event_type,state_before,state_after,actor_profile_id,reason_code,note,row_version")
    .eq("finding_id", findingId)
    .eq("event_type", "resolution_recorded")
    .order("created_at");

  if (audit.error || (audit.data?.length ?? 0) !== 2) {
    fail("Audit trail-ul uman nu are două decizii.");
  }

  if (
    audit.data?.some((event) => event.actor_profile_id !== profile.data.id) ||
    audit.data?.[0]?.reason_code !== "source_belongs_elsewhere" ||
    audit.data?.[1]?.reason_code !== "dismissed_with_reason" ||
    audit.data?.[1]?.row_version !== 3
  ) {
    fail("Audit trail-ul nu păstrează actorul, motivul și versiunea.");
  }

  console.log("PASS: Context Integrity CI-2.2 local human resolution.");
  console.log("- stale row version rejected");
  console.log("- stale finding fingerprint rejected");
  console.log("- valid human decision recorded");
  console.log("- decision revision recorded as a second audit event");
  console.log("- actor is derived from authenticated context");
  console.log("- no CRM relink, provider write, or source mutation performed");
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
        where case_key = ${sqlLiteral(caseKey)}
      );
      delete from public.context_integrity_findings
      where case_key = ${sqlLiteral(caseKey)};
    `);
  } catch {
    // Best-effort local cleanup only.
  }
}
