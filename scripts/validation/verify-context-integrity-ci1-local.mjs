import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { createLocalAdminClient } from "../demo/local-supabase.mjs";

const ROOT = process.cwd();
const nativeRequire = createRequire(import.meta.url);

function loadTs(entry) {
  const cache = new Map();

  const load = (file) => {
    const full = path.resolve(file);
    if (cache.has(full)) return cache.get(full);

    const module = { exports: {} };
    cache.set(full, module.exports);

    const output = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true
      }
    }).outputText;

    const require = (id) => {
      if (id === "server-only") return {};
      if (id.startsWith("@/")) return load(path.join(ROOT, "src", id.slice(2) + ".ts"));
      if (id.startsWith(".")) {
        const resolved = path.resolve(path.dirname(full), id);
        return load(resolved.endsWith(".ts") ? resolved : resolved + ".ts");
      }
      return nativeRequire(id);
    };

    vm.runInNewContext(
      output,
      {
        module,
        exports: module.exports,
        require,
        Date,
        URL,
        Map,
        Set,
        Array,
        Object,
        Number,
        String,
        Boolean,
        RegExp,
        Math,
        JSON,
        encodeURIComponent,
        Error
      },
      { filename: full }
    );

    return module.exports;
  };

  return load(entry);
}

function fail(message) {
  console.error("FAIL:", message);
  process.exit(1);
}


const { client } = createLocalAdminClient();

const businesses = await client
  .from("businesses")
  .select("id,name")
  .eq("name", "Meridian Commercial Operations")
  .limit(2);

if (businesses.error) fail("Nu am putut citi workspace-ul demo local.");
if ((businesses.data ?? []).length !== 1) fail("Workspace-ul Meridian nu este unic în baza locală.");
const business = businesses.data[0];

const organizations = await client
  .from("crm_organizations")
  .select("id,business_id,name,normalized_name")
  .eq("business_id", business.id)
  .order("normalized_name")
  .limit(37);

if (organizations.error) fail("Nu am putut citi companiile CRM locale.");
if ((organizations.data ?? []).length > 36) {
  fail("Verifierul refuză alias resolution peste directorul CRM bounded de 36 de companii.");
}

const normalize = (value) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const targetOpportunity = await client
  .from("opportunities")
  .select("id,business_id,title,organization_id,updated_at")
  .eq("business_id", business.id)
  .eq("title", "Program servicii corporate · Nova Medical")
  .limit(2);

if (targetOpportunity.error) fail("Nu am putut citi oportunitatea golden case.");
if ((targetOpportunity.data ?? []).length !== 1) {
  fail("Oportunitatea golden case nu este unică în Meridian.");
}

const opportunity = targetOpportunity.data[0];
const nova = (organizations.data ?? []).find(
  (item) => item.id === opportunity.organization_id
);

if (!nova) {
  fail("Compania canonică a oportunității nu se rezolvă prin organization_id în Meridian.");
}

const sources = await client
  .from("external_document_sources")
  .select("id,business_id,opportunity_id,name,mime_type,modified_time,last_synced_at,content_hash,provider_version,document_kind,state")
  .eq("business_id", business.id)
  .eq("state", "synced")
  .order("last_synced_at", { ascending: false })
  .limit(51);

if (sources.error) fail("Nu am putut citi sursele Drive locale.");
if ((sources.data ?? []).length > 50) fail("Verifierul refuză să pretindă acoperire completă peste 50 de surse.");
if (!(sources.data ?? []).length) fail("Nu există surse Drive sincronizate în Meridian.");

const sourceIds = sources.data.map((item) => item.id);

const segments = await client
  .from("external_document_segments")
  .select("id,source_id,business_id,ordinal,text,location_label")
  .eq("business_id", business.id)
  .in("source_id", sourceIds)
  .order("source_id")
  .order("ordinal")
  .limit(145);

if (segments.error) fail("Nu am putut citi segmentele Drive locale.");
if ((segments.data ?? []).length > 144) fail("Verifierul refuză să pretindă acoperire completă peste 144 de segmente.");

const vectorSegments = (segments.data ?? []).filter((row) =>
  row.text.split(/\r?\n/).some((line) => /^Client\s*:\s*Vector Industrial\s*$/i.test(line.trim()))
);

if (!vectorSegments.length) {
  fail("Nu am găsit câmpul explicit «Client: Vector Industrial» în sursele Drive sincronizate.");
}

const candidates = vectorSegments
  .map((row) => ({
    row,
    source: sources.data.find((item) => item.id === row.source_id)
  }))
  .filter(
    (item) =>
      item.source?.opportunity_id === opportunity.id &&
      item.source?.business_id === business.id
  )
  .map((item) => ({ source: item.source, row: item.row, opportunity }));

if (candidates.length !== 1) {
  fail("Golden case-ul Drive ↔ oportunitatea Nova Medical nu se rezolvă unic în datele locale.");
}

const target = candidates[0];
const targetSources = sources.data.filter(
  (item) => item.opportunity_id === target.opportunity.id
);
const targetSegments = (segments.data ?? []).filter((row) =>
  targetSources.some((source) => source.id === row.source_id)
);

const adaptedSegments = targetSegments.map((row) => {
  const source = targetSources.find((item) => item.id === row.source_id);
  return {
    businessId: business.id,
    opportunityId: target.opportunity.id,
    sourceId: source.id,
    segmentId: row.id,
    title: source.name,
    kind: source.document_kind,
    text: row.text,
    location: row.location_label,
    modifiedAt: source.modified_time,
    syncedAt: source.last_synced_at,
    mime: source.mime_type,
    sourceVersion: source.content_hash ?? source.provider_version ?? null
  };
});

const adapter = loadTs(
  path.join(ROOT, "src/lib/context-integrity/commercial-truth-adapter.ts")
);

const result = adapter.buildOpportunityContextIntegrity({
  businessId: business.id,
  opportunityId: target.opportunity.id,
  opportunityTitle: target.opportunity.title,
  opportunityObservedAt: target.opportunity.updated_at,
  organizationId: nova.id,
  companyName: nova.name,
  segments: adaptedSegments,
  companies: organizations.data.map((item) => ({
    businessId: item.business_id,
    id: item.id,
    name: item.name,
    normalizedName: item.normalized_name
  })),
  directoryComplete: true,
  coverage: {
    status: "complete",
    evaluatedSourceCount: targetSources.length,
    expectedSourceCount: targetSources.length
  }
});

const finding = result.evaluation.findings.find(
  (item) => item.kind === "source_association_mismatch"
);

if (!finding) fail("Context Integrity nu a emis source_association_mismatch pentru golden case.");
if (finding.severity !== "high") fail("Severitatea golden case-ului nu este high.");
if (finding.safeAction !== "review_association") fail("Acțiunea sigură nu este review_association.");
if (finding.visibility.scope !== "business") fail("Dovada Drive shared nu a rămas business-visible.");

if (
  !finding.evidence.some(
    (item) => item.sourceId === target.source.id && item.sourceSegmentId === target.row.id
  )
) {
  fail("Finding-ul nu păstrează coordonata exactă a dovezii Drive.");
}

const declaration = result.declarations.find(
  (item) =>
    item.sourceId === target.source.id &&
    item.normalizedLabel === normalize("Vector Industrial")
);

const vectorCanonical = declaration?.canonicalId
  ? (organizations.data ?? []).find((item) => item.id === declaration.canonicalId)
  : null;

if (
  !declaration ||
  declaration.resolution !== "resolved" ||
  !vectorCanonical ||
  vectorCanonical.name !== "Vector Industrial Services SRL"
) {
  fail("Vector Industrial nu s-a rezolvat determinist la identitatea CRM canonică.");
}

console.log("PASS: Context Integrity CI-1 real local golden case.");
console.log("Workspace: Meridian Commercial Operations");
console.log(`Context CRM: ${nova.name}`);
console.log(`Identitate explicită în Drive: Vector Industrial → ${vectorCanonical.name}`);
console.log("Finding: source_association_mismatch · high · review_association");
console.log(`Dovadă: ${target.source.name} · ${target.row.location_label}`);
console.log("No mutation, no relink, no provider write, no source body printed.");
