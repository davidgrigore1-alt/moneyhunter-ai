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
      if (id.startsWith("@/")) {
        const relative = id.slice(2);
        for (const suffix of [".ts", ".tsx", "/index.ts"]) {
          const candidate = path.join(ROOT, "src", relative + suffix);
          if (fs.existsSync(candidate)) return load(candidate);
        }
      }

      if (id.startsWith(".")) {
        const resolved = path.resolve(path.dirname(full), id);
        for (const candidate of [
          resolved,
          resolved + ".ts",
          resolved + ".tsx",
          path.join(resolved, "index.ts")
        ]) {
          if (fs.existsSync(candidate)) return load(candidate);
        }
      }

      return nativeRequire(id);
    };

    vm.runInNewContext(
      output,
      {
        module,
        exports: module.exports,
        require: localRequire,
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

const queue = loadTs(
  path.join(ROOT, "src/lib/context-integrity/recovery-queue.ts")
);

function opportunity({
  id = "opp-1",
  businessId = "business-1",
  title = "Program servicii corporate · Nova Medical",
  value = 15500,
  currency = "RON"
} = {}) {
  return {
    id,
    businessId,
    title,
    type: "b2b_lead",
    status: "qualified",
    commercialType: "new_business",
    lifecycleStatus: "open",
    estimatedValueLow: value,
    estimatedValueHigh: value,
    currency,
    ownerProfileId: "profile-1",
    ownerName: "Irina Petrescu",
    organizationId: "org-1",
    organizationName: "Nova Medical Systems SRL",
    deadline: null,
    contacts: [],
    actions: [],
    documents: [],
    timeline: [],
    signals: [],
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-10T09:00:00.000Z"
  };
}

function finding({
  id = "finding-1",
  businessId = "business-1",
  opportunityId = "opp-1",
  kind = "source_association_mismatch",
  field = "customer_identity",
  severity = "high",
  state = "needs_review",
  safeAction = "review_association",
  firstDetectedAt = "2026-09-08T10:00:00.000Z",
  lastDetectedAt = "2026-09-10T10:00:00.000Z",
  lastEvaluatedAt = "2026-09-10T10:00:00.000Z"
} = {}) {
  return {
    id,
    businessId,
    opportunityId,
    kind,
    field,
    severity,
    state,
    safeAction,
    firstDetectedAt,
    lastDetectedAt,
    lastEvaluatedAt
  };
}

test("CI23-01 groups multiple active findings into one opportunity row", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding(), finding({ id: "finding-2", kind: "next_action_mismatch", safeAction: "review_next_action" })],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].findingCount, 2);
  assert.equal(result.activeFindingCount, 2);
});

test("CI23-02 resolved findings do not appear in the active queue", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding({ state: "resolved" })],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items.length, 0);
});

test("CI23-03 dismissed findings do not appear in the active queue", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding({ state: "dismissed" })],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items.length, 0);
});

test("CI23-04 foreign tenant findings fail closed", () => {
  assert.throws(
    () =>
      queue.buildContextIntegrityRecoveryQueue({
        businessId: "business-1",
        opportunities: [opportunity()],
        findings: [finding({ businessId: "business-2" })],
        now: new Date("2026-09-10T12:00:00.000Z")
      }),
    /tenant_scope_forbidden/
  );
});

test("CI23-05 findings for invisible opportunities are excluded", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding({ opportunityId: "opp-hidden" })],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items.length, 0);
});

test("CI23-06 critical severity ranks before high", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [
      opportunity({ id: "opp-high", title: "High" }),
      opportunity({ id: "opp-critical", title: "Critical" })
    ],
    findings: [
      finding({ id: "high", opportunityId: "opp-high", severity: "high" }),
      finding({ id: "critical", opportunityId: "opp-critical", severity: "critical" })
    ],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items[0].opportunityId, "opp-critical");
});

test("CI23-07 oldest unresolved case breaks severity ties", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [
      opportunity({ id: "opp-new", title: "New" }),
      opportunity({ id: "opp-old", title: "Old" })
    ],
    findings: [
      finding({ id: "new", opportunityId: "opp-new", firstDetectedAt: "2026-09-10T10:00:00.000Z" }),
      finding({ id: "old", opportunityId: "opp-old", firstDetectedAt: "2026-09-05T10:00:00.000Z" })
    ],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items[0].opportunityId, "opp-old");
});

test("CI23-08 age is expressed in whole non-negative days", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding({ firstDetectedAt: "2026-09-08T10:00:00.000Z" })],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items[0].ageDays, 2);
});

test("CI23-09 estimated exposure is deduplicated per opportunity", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity({ value: 15500 })],
    findings: [finding(), finding({ id: "finding-2", kind: "next_action_mismatch", safeAction: "review_next_action" })],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.exposure.RON, 15500);
});

test("CI23-10 currencies are never silently combined", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [
      opportunity({ id: "opp-ron", value: 15500, currency: "RON" }),
      opportunity({ id: "opp-eur", value: 12000, currency: "EUR" })
    ],
    findings: [
      finding({ id: "ron", opportunityId: "opp-ron" }),
      finding({ id: "eur", opportunityId: "opp-eur" })
    ],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.exposure.RON, 15500);
  assert.equal(result.exposure.EUR, 12000);
});

test("CI23-11 review href goes directly to the existing Context Integrity surface", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding()],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(
    result.items[0].reviewHref,
    "/opportunities/opp-1?tab=context#context-integrity-review"
  );
});

test("CI23-12 source association uses plain-language action copy", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [opportunity()],
    findings: [finding()],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.items[0].primaryLabel, "Verifică asocierea documentului");
  assert.equal(result.items[0].safeActionLabel, "Revizuiește contextul");
});

test("CI23-13 high priority count includes only high and critical", () => {
  const result = queue.buildContextIntegrityRecoveryQueue({
    businessId: "business-1",
    opportunities: [
      opportunity({ id: "opp-high" }),
      opportunity({ id: "opp-medium" })
    ],
    findings: [
      finding({ id: "high", opportunityId: "opp-high", severity: "high" }),
      finding({ id: "medium", opportunityId: "opp-medium", severity: "medium" })
    ],
    now: new Date("2026-09-10T12:00:00.000Z")
  });

  assert.equal(result.highPriorityCount, 1);
});

test("CI23-14 server loader uses authenticated RLS client, not admin", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue-server.ts",
    "utf8"
  );
  assert.match(source, /createSupabaseServerClient/);
  assert.doesNotMatch(source, /createSupabaseAdminClient/);
});

test("CI23-15 server loader requires opportunity read permission", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue-server.ts",
    "utf8"
  );
  assert.match(source, /requirePermission\("opportunities\.read"\)/);
});

test("CI23-16 server loader scopes findings to current business and visible opportunity ids", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue-server.ts",
    "utf8"
  );
  assert.match(source, /\.eq\("business_id", current\.business\.id\)/);
  assert.match(source, /\.in\("opportunity_id", scopedIds\)/);
});

test("CI23-17 loader selects only active persistent states", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue-server.ts",
    "utf8"
  );
  assert.match(source, /\.in\("state", \["open", "needs_review"\]\)/);
});

test("CI23-18 loader is bounded", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue-server.ts",
    "utf8"
  );
  assert.match(source, /RECOVERY_LIMITS\.opportunities/);
  assert.match(source, /RECOVERY_LIMITS\.findings \+ 1/);
});

test("CI23-19 loader never reads source bodies or document segments", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue-server.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /external_document_segments|raw_source_text|segment\.text|excerpt/i);
});

test("CI23-20 recovery projection performs no model or provider calls", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/recovery-queue.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /openai|googleapis|gmail|fetch\s*\(|\.rpc\s*\(/i);
});

test("CI23-21 dashboard integrates the queue into the existing control center page", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/dashboard/page.tsx",
    "utf8"
  );
  assert.match(page, /ContextIntegrityRecoveryQueue/);
  assert.match(page, /getContextIntegrityRecoveryQueue/);
});

test("CI23-22 no new recovery route is introduced", () => {
  assert.equal(
    fs.existsSync("src/app/(protected)/recovery-queue/page.tsx"),
    false
  );
});

test("CI23-23 opportunity context provides a direct review anchor", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/opportunities/[id]/page.tsx",
    "utf8"
  );
  assert.match(page, /id="context-integrity-review"/);
});

test("CI23-24 queue copy explicitly avoids fake recovered revenue", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
    "utf8"
  );
  assert.match(component, /Valoarea afișată este estimată, nu venit recuperat/);
});

test("CI23-25 queue is compact by default and expands remaining cases", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
    "utf8"
  );
  assert.match(component, /visibleRows/);
  assert.match(component, /<details className=\{styles\.more\}>/);
});

test("CI23-26 queue has a single action per row", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
    "utf8"
  );
  const rowBlock = component.match(/function QueueRow[\s\S]*?\n}\n\nexport function/)?.[0] ?? "";
  assert.equal((rowBlock.match(/<Link/g) ?? []).length, 1);
});

test("CI23-27 component does not expose internal finding ids or fingerprints", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
    "utf8"
  );
  assert.doesNotMatch(component, /findingKey|findingId|rowVersion/);
});

test("CI23-28 queue UI is low-chrome and has no horizontal scrolling", () => {
  const css = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.module.css",
    "utf8"
  );
  assert.doesNotMatch(css, /overflow-x:\s*auto/);
  assert.doesNotMatch(css, /radial-gradient|filter:\s*blur/);
});

test("CI23-29 queue rows explain the issue before asking for action", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
    "utf8"
  );
  assert.ok(component.indexOf("primaryReason") < component.indexOf("safeActionLabel"));
});

test("CI23-30 queue does not claim to cover all commercial execution breaks", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
    "utf8"
  );
  assert.match(component, /Neconcordanțe persistente între contextul comercial și\s*sursele conectate/);
});
