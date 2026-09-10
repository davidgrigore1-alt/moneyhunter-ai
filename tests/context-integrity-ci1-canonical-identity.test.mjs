import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

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
    const localRequire = (id) => {
      if (id.startsWith("@/")) return load(path.join(ROOT, "src", id.slice(2) + ".ts"));
      if (id.startsWith(".")) {
        const resolved = path.resolve(path.dirname(full), id);
        return load(resolved.endsWith(".ts") ? resolved : resolved + ".ts");
      }
      return nativeRequire(id);
    };
    vm.runInNewContext(output, {
      module, exports: module.exports, require: localRequire,
      Date, URL, Map, Set, Array, Object, Number, String, Boolean, RegExp, Math, JSON,
      encodeURIComponent, Error
    }, { filename: full });
    return module.exports;
  };
  return load(entry);
}

const adapter = loadTs(path.join(ROOT, "src/lib/context-integrity/commercial-truth-adapter.ts"));

const B = "business";
const O = "opportunity";
const NOVA = "nova-id";
const VECTOR = "vector-id";

function company(id, name, businessId = B) {
  return { businessId, id, name, normalizedName: adapter.normalizeContextIdentity(name) };
}

function segment(text) {
  return {
    businessId: B,
    opportunityId: O,
    sourceId: "drive-source",
    segmentId: "segment-1",
    title: "Contract comercial",
    kind: "contract",
    text,
    location: "Liniile 1–3",
    modifiedAt: "2026-09-09T10:00:00.000Z",
    syncedAt: "2026-09-09T10:01:00.000Z",
    mime: "application/vnd.google-apps.document",
    sourceVersion: "hash-v1"
  };
}

function build(text, companies, directoryComplete = true) {
  return adapter.buildOpportunityContextIntegrity({
    businessId: B,
    opportunityId: O,
    opportunityTitle: "Program servicii corporate · Nova Medical",
    opportunityObservedAt: "2026-09-09T09:00:00.000Z",
    organizationId: NOVA,
    companyName: "Nova Medical Systems SRL",
    segments: [segment(text)],
    companies,
    directoryComplete,
    coverage: { status: "complete", evaluatedSourceCount: 1, expectedSourceCount: 1 }
  });
}

test("legal-name alias uses exact whole-token prefix only", () => {
  assert.equal(
    adapter.isDeterministicContextIdentityAlias(
      "vector industrial",
      "vector industrial services srl"
    ),
    true
  );
  assert.equal(
    adapter.isDeterministicContextIdentityAlias("nova med", "nova medical systems srl"),
    false
  );
});

test("short current brand resolves to the persisted canonical CRM organization", () => {
  const result = build("Client: Nova Medical", [
    company(NOVA, "Nova Medical Systems SRL"),
    company(VECTOR, "Vector Industrial Services SRL")
  ]);
  assert.equal(result.declarations[0].resolution, "resolved");
  assert.equal(result.declarations[0].canonicalId, NOVA);
  assert.equal(result.evaluation.findings.length, 0);
});

test("Vector Industrial resolves uniquely to Vector Industrial Services SRL and conflicts with Nova", () => {
  const result = build("Client: Vector Industrial", [
    company(NOVA, "Nova Medical Systems SRL"),
    company(VECTOR, "Vector Industrial Services SRL")
  ]);
  assert.equal(result.declarations[0].resolution, "resolved");
  assert.equal(result.declarations[0].canonicalId, VECTOR);
  const finding = result.evaluation.findings.find((item) => item.kind === "source_association_mismatch");
  assert.ok(finding);
  assert.equal(finding.severity, "high");
  assert.equal(finding.safeAction, "review_association");
});

test("one-token aliases stay unresolved", () => {
  const result = build("Client: Vector", [
    company(NOVA, "Nova Medical Systems SRL"),
    company(VECTOR, "Vector Industrial Services SRL")
  ]);
  assert.equal(result.declarations[0].resolution, "unresolved");
  assert.equal(result.evaluation.findings.length, 0);
});

test("ambiguous legal-name aliases stay ambiguous and create no hard mismatch", () => {
  const result = build("Client: Vector Industrial", [
    company(NOVA, "Nova Medical Systems SRL"),
    company("vector-services", "Vector Industrial Services SRL"),
    company("vector-logistics", "Vector Industrial Logistics SRL")
  ]);
  assert.equal(result.declarations[0].resolution, "ambiguous");
  assert.equal(result.evaluation.findings.length, 0);
});

test("incomplete tenant directory refuses alias hard resolution", () => {
  const result = build("Client: Vector Industrial", [
    company(NOVA, "Nova Medical Systems SRL"),
    company(VECTOR, "Vector Industrial Services SRL")
  ], false);
  assert.equal(result.declarations[0].resolution, "unresolved");
  assert.equal(result.evaluation.findings.length, 0);
});

test("foreign-tenant alias candidates never resolve", () => {
  const result = build("Client: Vector Industrial", [
    company(NOVA, "Nova Medical Systems SRL"),
    company(VECTOR, "Vector Industrial Services SRL", "other-business")
  ]);
  assert.equal(result.declarations[0].resolution, "unresolved");
  assert.equal(result.evaluation.findings.length, 0);
});

test("server retains exact lookup and adds bounded tenant alias directory fallback", () => {
  const server = fs.readFileSync("src/lib/commercial-truth-server.ts", "utf8");
  assert.match(server, /\.in\("normalized_name",declaredIdentityKeys\)/);
  assert.match(server, /CONTEXT_INTEGRITY_ADAPTER_LIMITS\.candidateCompanies\+1/);
  assert.match(server, /company_identity_alias_directory_incomplete/);
});

test("ACL migration grants only service_role SELECT on CRM organizations", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910123000_context_integrity_crm_service_role_select.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /grant select on table public\.crm_organizations to service_role/);
  assert.doesNotMatch(sql, /to anon|to authenticated|grant insert|grant update|grant delete/);
});
