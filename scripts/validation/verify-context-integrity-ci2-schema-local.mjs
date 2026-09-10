import { createLocalAdminClient, runLocalSql } from "../demo/local-supabase.mjs";

const expectedTables = [
  "context_integrity_findings",
  "context_integrity_finding_events"
];

try {
  const { client } = createLocalAdminClient();

  for (const table of expectedTables) {
    const result = await client.from(table).select("id", { head: true, count: "exact" }).limit(1);
    if (result.error) {
      throw new Error(`${table}: ${result.error.code ?? "unknown"} ${result.error.message ?? ""}`.trim());
    }
  }

  const privilege = runLocalSql(`
    select json_build_object(
      'findings_service_select', has_table_privilege('service_role','public.context_integrity_findings','SELECT'),
      'findings_service_insert', has_table_privilege('service_role','public.context_integrity_findings','INSERT'),
      'findings_service_update', has_table_privilege('service_role','public.context_integrity_findings','UPDATE'),
      'events_service_insert', has_table_privilege('service_role','public.context_integrity_finding_events','INSERT'),
      'events_service_delete', has_table_privilege('service_role','public.context_integrity_finding_events','DELETE'),
      'findings_authenticated_select', has_table_privilege('authenticated','public.context_integrity_findings','SELECT'),
      'findings_authenticated_update', has_table_privilege('authenticated','public.context_integrity_findings','UPDATE')
    );
  `);

  if (!/"findings_service_select"\s*:\s*true/.test(privilege)) throw new Error("service_role SELECT lipsește pe findings");
  if (!/"findings_service_insert"\s*:\s*true/.test(privilege)) throw new Error("service_role INSERT lipsește pe findings");
  if (!/"findings_service_update"\s*:\s*true/.test(privilege)) throw new Error("service_role UPDATE lipsește pe findings");
  if (!/"events_service_insert"\s*:\s*true/.test(privilege)) throw new Error("service_role INSERT lipsește pe audit events");
  if (!/"events_service_delete"\s*:\s*false/.test(privilege)) throw new Error("audit events permit DELETE pentru service_role");
  if (!/"findings_authenticated_select"\s*:\s*true/.test(privilege)) throw new Error("authenticated SELECT lipsește");
  if (!/"findings_authenticated_update"\s*:\s*false/.test(privilege)) throw new Error("authenticated are UPDATE direct pe findings");

  console.log("PASS: Context Integrity CI-2.0 local schema.");
  console.log("- persistent finding table available");
  console.log("- immutable-style event table available");
  console.log("- authenticated access is read-only");
  console.log("- service_role can reconcile but cannot delete audit events");
  console.log("- no source body or secret printed");
} catch (error) {
  console.error("FAIL:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
