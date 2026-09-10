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

    const output = ts.transpileModule(
      fs.readFileSync(full, "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true
        }
      }
    ).outputText;

    const localRequire = (id) => {
      if (id.startsWith("@/")) {
        const rel = id.slice(2);
        for (const suffix of [".ts", ".tsx", "/index.ts"]) {
          const candidate = path.join(ROOT, "src", rel + suffix);
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
        Error,
        Intl
      },
      { filename: full }
    );

    return module.exports;
  };

  return load(entry);
}

const model = loadTs(
  path.join(ROOT, "src/lib/recovery-timeline/model.ts")
);

function opportunity(id = "opp-1", overrides = {}) {
  return {
    id,
    businessId: "business-1",
    title: "Program servicii corporate · Nova Medical",
    type: "b2b_lead",
    status: "qualified",
    lifecycleStatus: "open",
    commercialType: "new_business",
    ownerProfileId: "profile-1",
    ownerName: "Irina Petrescu",
    currency: "RON",
    estimatedValueLow: 15500,
    estimatedValueHigh: 15500,
    city: "București",
    county: "București",
    fitScore: 90,
    urgencyScore: 80,
    moneyScore: 70,
    confidenceScore: 80,
    summary: "",
    relevance: [],
    risks: [],
    recommendedAction: "",
    rawSourceText: "",
    timeline: [],
    documents: [],
    actions: [],
    ...overrides
  };
}

function evidence(id = "e-1") {
  return {
    id,
    kind: "source",
    sourceType: "action",
    label: "Confirmă criteriile de achiziție",
    observedAt: "2026-09-08T10:00:00.000Z",
    href: "/opportunities/opp-1",
    actorLabel: null
  };
}

function executionFinding(overrides = {}) {
  return {
    id: "ef-1",
    businessId: "business-1",
    opportunityId: "opp-1",
    caseKey: "case-exec",
    findingKey: "finding-exec",
    code: "overdue_next_action",
    severity: "critical",
    sourceType: "action",
    sourceId: "action-1",
    label: "Acțiune restantă",
    explanation: "Următoarea acțiune nu a fost finalizată până la termen.",
    safeActionLabel: "Revizuiește acțiunea restantă",
    safeActionHref: "/opportunities/opp-1#workflow-actions-list",
    evidenceRefs: [evidence()],
    state: "open",
    firstDetectedAt: "2026-09-06T10:00:00.000Z",
    lastDetectedAt: "2026-09-10T10:00:00.000Z",
    lastEvaluatedAt: "2026-09-10T10:00:00.000Z",
    resolvedAt: null,
    ...overrides
  };
}

function contextFinding(overrides = {}) {
  return {
    id: "cf-1",
    businessId: "business-1",
    opportunityId: "opp-1",
    caseKey: "case-context",
    findingKey: "finding-context",
    kind: "source_association_mismatch",
    severity: "high",
    safeAction: "review_association",
    evidenceRefs: [
      {
        ...evidence("ctx-1"),
        sourceType: "google_drive",
        label: "Program servicii corporate · Nova Medical"
      }
    ],
    state: "needs_review",
    firstDetectedAt: "2026-09-07T10:00:00.000Z",
    lastDetectedAt: "2026-09-10T10:00:00.000Z",
    lastEvaluatedAt: "2026-09-10T10:00:00.000Z",
    resolutionReason: null,
    resolutionNote: null,
    resolvedByProfileId: null,
    resolvedAt: null,
    ...overrides
  };
}

function build(overrides = {}) {
  return model.buildRecoveryTimelineModel({
    opportunities: [opportunity()],
    executionFindings: [],
    contextFindings: [],
    executionEvents: [],
    contextEvents: [],
    opportunityEvents: [],
    signalEvents: [],
    now: new Date("2026-09-10T12:00:00.000Z"),
    ...overrides
  });
}

test("RT-01 active execution case appears in timeline", () => {
  const result = build({
    executionFindings: [executionFinding()]
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].status, "open");
});

test("RT-02 execution case preserves first-detected aging", () => {
  const result = build({
    executionFindings: [executionFinding()]
  });
  assert.equal(result.items[0].ageDays, 4);
});

test("RT-03 resolved execution case is included within the 30-day window", () => {
  const result = build({
    executionFindings: [
      executionFinding({
        state: "resolved",
        resolvedAt: "2026-09-10T11:00:00.000Z"
      })
    ]
  });
  assert.equal(result.resolvedCount, 1);
});

test("RT-04 old resolved execution case is excluded", () => {
  const result = build({
    executionFindings: [
      executionFinding({
        state: "resolved",
        firstDetectedAt: "2026-07-01T10:00:00.000Z",
        resolvedAt: "2026-07-02T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.items.length, 0);
});

test("RT-05 reopened execution case receives distinct status", () => {
  const result = build({
    executionFindings: [executionFinding()],
    executionEvents: [
      {
        id: "ev-1",
        findingId: "ef-1",
        eventType: "reopened",
        at: "2026-09-10T10:00:00.000Z",
        actorProfileId: null,
        actorLabel: null,
        note: null
      }
    ]
  });
  assert.equal(result.items[0].status, "reopened");
});

test("RT-06 context review case appears as open", () => {
  const result = build({
    contextFindings: [contextFinding()]
  });
  assert.equal(result.items[0].status, "open");
});

test("RT-07 context human resolution becomes resolved", () => {
  const result = build({
    contextFindings: [
      contextFinding({
        state: "resolved",
        resolutionReason: "source_belongs_elsewhere",
        resolvedAt: "2026-09-10T11:00:00.000Z"
      })
    ]
  });
  assert.equal(result.items[0].status, "resolved");
  assert.match(
    result.items[0].resolutionSummary,
    /altui context/
  );
});

test("RT-08 dismissed context finding is represented as resolved proof", () => {
  const result = build({
    contextFindings: [
      contextFinding({
        state: "dismissed",
        resolutionReason: "dismissed_with_reason",
        resolutionNote: "Nu aparține acestui proces.",
        resolvedAt: "2026-09-10T11:00:00.000Z"
      })
    ]
  });
  assert.equal(result.items[0].status, "resolved");
  assert.equal(
    result.items[0].resolutionNote,
    "Nu aparține acestui proces."
  );
});

test("RT-09 low-signal insufficient-context finding is omitted", () => {
  const result = build({
    contextFindings: [
      contextFinding({
        kind: "insufficient_context_integrity",
        severity: "review"
      })
    ]
  });
  assert.equal(result.items.length, 0);
});

test("RT-10 active cases sort before resolved proof", () => {
  const result = build({
    executionFindings: [
      executionFinding({ id: "open" }),
      executionFinding({
        id: "resolved",
        caseKey: "resolved-case",
        findingKey: "resolved-finding",
        state: "resolved",
        resolvedAt: "2026-09-10T11:30:00.000Z"
      })
    ]
  });
  assert.equal(result.items[0].status, "open");
});

test("RT-11 critical active case sorts before attention active case", () => {
  const result = build({
    opportunities: [
      opportunity("opp-1"),
      opportunity("opp-2", {
        title: "Altă oportunitate"
      })
    ],
    executionFindings: [
      executionFinding({
        id: "attention",
        opportunityId: "opp-1",
        severity: "attention",
        code: "unassigned_owner"
      }),
      executionFinding({
        id: "critical",
        opportunityId: "opp-2",
        caseKey: "case-2",
        findingKey: "finding-2",
        severity: "critical"
      })
    ]
  });
  assert.equal(result.items[0].id, "execution:critical");
});

test("RT-12 estimated value is deduplicated per opportunity", () => {
  const result = build({
    executionFindings: [executionFinding()],
    contextFindings: [contextFinding()]
  });
  assert.equal(result.valueAssociated[0].amount, 15500);
});

test("RT-13 currencies remain separate", () => {
  const result = build({
    opportunities: [
      opportunity("opp-1"),
      opportunity("opp-2", {
        currency: "EUR",
        estimatedValueLow: 12000,
        estimatedValueHigh: 12000
      })
    ],
    executionFindings: [
      executionFinding(),
      executionFinding({
        id: "ef-2",
        opportunityId: "opp-2",
        caseKey: "case-2",
        findingKey: "finding-2"
      })
    ]
  });
  assert.equal(result.valueAssociated.length, 2);
});

test("RT-14 average resolution time uses only resolved cases", () => {
  const result = build({
    executionFindings: [
      executionFinding({
        state: "resolved",
        firstDetectedAt: "2026-09-09T10:00:00.000Z",
        resolvedAt: "2026-09-10T10:00:00.000Z"
      }),
      executionFinding({
        id: "open-2",
        caseKey: "open-case-2",
        findingKey: "open-finding-2"
      })
    ]
  });
  assert.equal(result.averageResolutionMinutes, 1440);
});

test("RT-15 exact opportunity audit event can become resolution evidence", () => {
  const result = build({
    executionFindings: [
      executionFinding({
        state: "resolved",
        resolvedAt: "2026-09-10T10:01:00.000Z"
      })
    ],
    opportunityEvents: [
      {
        id: "oe-1",
        opportunityId: "opp-1",
        eventType: "next_action_completed",
        label: "Acțiune finalizată",
        description: "",
        at: "2026-09-10T10:00:30.000Z",
        actorProfileId: "profile-1",
        actorLabel: "Irina Petrescu",
        metadata: { action_id: "action-1" }
      }
    ]
  });
  assert.equal(
    result.items[0].resolutionSummary,
    "Acțiune finalizată"
  );
  assert.equal(
    result.items[0].evidence[0].kind,
    "resolution"
  );
});

test("RT-16 unrelated action audit does not become false resolution evidence", () => {
  const result = build({
    executionFindings: [
      executionFinding({
        state: "resolved",
        resolvedAt: "2026-09-10T10:01:00.000Z"
      })
    ],
    opportunityEvents: [
      {
        id: "oe-1",
        opportunityId: "opp-1",
        eventType: "next_action_completed",
        label: "Altă acțiune finalizată",
        description: "",
        at: "2026-09-10T10:00:30.000Z",
        actorProfileId: null,
        actorLabel: null,
        metadata: { action_id: "different-action" }
      }
    ]
  });
  assert.notEqual(
    result.items[0].resolutionSummary,
    "Altă acțiune finalizată"
  );
});

test("RT-17 far-away audit event does not become false resolution evidence", () => {
  const result = build({
    executionFindings: [
      executionFinding({
        state: "resolved",
        resolvedAt: "2026-09-10T10:30:00.000Z"
      })
    ],
    opportunityEvents: [
      {
        id: "oe-1",
        opportunityId: "opp-1",
        eventType: "next_action_completed",
        label: "Acțiune finalizată",
        description: "",
        at: "2026-09-10T10:00:00.000Z",
        actorProfileId: null,
        actorLabel: null,
        metadata: { action_id: "action-1" }
      }
    ]
  });
  assert.equal(
    result.items[0].evidence[0].kind,
    "source"
  );
});

test("RT-18 context resolution actor comes from resolution event", () => {
  const result = build({
    contextFindings: [
      contextFinding({
        state: "resolved",
        resolutionReason: "kept_current_context",
        resolvedAt: "2026-09-10T11:00:00.000Z"
      })
    ],
    contextEvents: [
      {
        id: "ce-1",
        findingId: "cf-1",
        eventType: "resolution_recorded",
        at: "2026-09-10T11:00:00.000Z",
        actorProfileId: "profile-1",
        actorLabel: "Irina Petrescu",
        note: null
      }
    ]
  });
  assert.equal(
    result.items[0].resolutionActorLabel,
    "Irina Petrescu"
  );
});

test("RT-19 lifecycle is chronological", () => {
  const result = build({
    executionFindings: [executionFinding()],
    executionEvents: [
      {
        id: "later",
        findingId: "ef-1",
        eventType: "changed",
        at: "2026-09-10T10:00:00.000Z",
        actorProfileId: null,
        actorLabel: null,
        note: null
      },
      {
        id: "early",
        findingId: "ef-1",
        eventType: "detected",
        at: "2026-09-06T10:00:00.000Z",
        actorProfileId: null,
        actorLabel: null,
        note: null
      }
    ]
  });
  assert.equal(result.items[0].lifecycle[0].id, "early");
});

test("RT-20 lifecycle is bounded for cognitive clarity", () => {
  const executionEvents = Array.from({ length: 10 }, (_, index) => ({
    id: `ev-${index}`,
    findingId: "ef-1",
    eventType: index === 0 ? "detected" : "changed",
    at: `2026-09-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
    actorProfileId: null,
    actorLabel: null,
    note: null
  }));
  const result = build({
    executionFindings: [executionFinding()],
    executionEvents
  });
  assert.ok(
    result.items[0].lifecycle.length <=
      model.RECOVERY_TIMELINE_LIMITS.maxLifecycleSteps
  );
});

test("RT-21 server loader is server-only", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.match(source, /^import "server-only";/);
});

test("RT-22 server loader derives current business scope", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.match(source, /getCurrentBusinessForUser/);
  assert.match(source, /recovery_timeline_scope_forbidden/);
});

test("RT-23 server loader requires opportunity read permission", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.match(source, /requirePermission\("opportunities\.read"\)/);
});

test("RT-24 server loader uses authenticated RLS client", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.match(source, /createSupabaseServerClient/);
  assert.doesNotMatch(source, /createSupabaseAdminClient/);
});

test("RT-25 queries are opportunity-scoped and bounded", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.match(source, /\.in\("opportunity_id", opportunityIds\)/);
  assert.match(source, /\.limit\(160\)/);
  assert.match(source, /\.limit\(320\)/);
});

test("RT-26 server does not read source bodies", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /raw_source_text|external_document_segments|segment\.text/i
  );
});

test("RT-27 server does not call providers or models", () => {
  const source = fs.readFileSync(
    "src/lib/recovery-timeline/server.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /openai|googleapis|gmail.*send|drive\.files|fetch\s*\(/i
  );
});

test("RT-28 dashboard loads the recovery timeline server model", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/dashboard/page.tsx",
    "utf8"
  );
  assert.match(page, /getRecoveryTimeline\(scopedOpportunities\)/);
});

test("RT-29 dashboard renders timeline after Commercial Recovery control center", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/dashboard/page.tsx",
    "utf8"
  );
  assert.ok(
    page.indexOf("<RecoveryTimeline") >
      page.indexOf("<ExecutionControlCenter")
  );
});

test("RT-30 surface contains exactly four executive metrics", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/RecoveryTimeline.tsx",
    "utf8"
  );
  for (const label of [
    "Deschise",
    "Rezolvate",
    "Timp mediu de rezolvare",
    "Valoare estimată asociată"
  ]) {
    assert.match(component, new RegExp(label));
  }
});

test("RT-31 default visible timeline is capped at six cases", () => {
  const modelSource = fs.readFileSync(
    "src/lib/recovery-timeline/model.ts",
    "utf8"
  );
  assert.match(modelSource, /defaultVisible: 6/);
});

test("RT-32 each timeline row exposes one dominant evidence action", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/RecoveryTimeline.tsx",
    "utf8"
  );
  const row = component.match(
    /function TimelineRow[\s\S]*?\n}\n\nexport function RecoveryTimeline/
  )?.[0] ?? "";
  assert.equal((row.match(/<button/g) ?? []).length, 1);
  assert.match(row, /Vezi dovada/);
});

test("RT-33 timeline visually separates active from resolved cases", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/RecoveryTimeline.tsx",
    "utf8"
  );
  assert.match(component, /Necesită atenție/);
  assert.match(component, /Rezolvate recent/);
});

test("RT-34 drawer has four clear information sections", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ResolutionEvidenceSheet.tsx",
    "utf8"
  );
  for (const label of [
    "Ce s-a schimbat",
    "Dovezi",
    "Lifecycle",
    "Valoare asociată"
  ]) {
    assert.match(component, new RegExp(label));
  }
});

test("RT-35 drawer is modal and keyboard-dismissible", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ResolutionEvidenceSheet.tsx",
    "utf8"
  );
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /event\.key === "Escape"/);
});

test("RT-36 drawer traps focus", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/ResolutionEvidenceSheet.tsx",
    "utf8"
  );
  assert.match(component, /event\.key !== "Tab"/);
  assert.match(component, /focusable\[0\]/);
});

test("RT-37 timeline copy explicitly rejects recovered-revenue inflation", () => {
  const component = fs.readFileSync(
    "src/components/dashboard/RecoveryTimeline.tsx",
    "utf8"
  );
  const sheet = fs.readFileSync(
    "src/components/dashboard/ResolutionEvidenceSheet.tsx",
    "utf8"
  );
  assert.match(component, /nu venit recuperat/);
  assert.match(sheet, /Nu reprezintă venit recuperat/);
});

test("RT-38 resolution language never claims causality without evidence", () => {
  const modelSource = fs.readFileSync(
    "src/lib/recovery-timeline/model.ts",
    "utf8"
  );
  assert.match(
    modelSource,
    /Starea sursei nu mai îndeplinește regula/
  );
});

test("RT-39 visual typography keeps primary copy comfortably readable", () => {
  const css = fs.readFileSync(
    "src/components/dashboard/RecoveryTimeline.module.css",
    "utf8"
  );
  assert.match(css, /\.description[\s\S]*?font-size: 13\.5px/);
  assert.match(css, /\.titleLine h3[\s\S]*?font-size: 16px/);
});

test("RT-40 visual surface has no sub-9px text", () => {
  const css = [
    fs.readFileSync(
      "src/components/dashboard/RecoveryTimeline.module.css",
      "utf8"
    ),
    fs.readFileSync(
      "src/components/dashboard/ResolutionEvidenceSheet.module.css",
      "utf8"
    )
  ].join("\n");
  assert.doesNotMatch(css, /font-size:\s*(?:7|8)(?:\.\d+)?px/);
});

test("RT-41 visual surface introduces no decorative gradients or glow", () => {
  const css = [
    fs.readFileSync(
      "src/components/dashboard/RecoveryTimeline.module.css",
      "utf8"
    ),
    fs.readFileSync(
      "src/components/dashboard/ResolutionEvidenceSheet.module.css",
      "utf8"
    )
  ].join("\n");
  assert.doesNotMatch(
    css,
    /linear-gradient|radial-gradient|drop-shadow/
  );
});

test("RT-42 no horizontal scrolling is introduced", () => {
  const css = [
    fs.readFileSync(
      "src/components/dashboard/RecoveryTimeline.module.css",
      "utf8"
    ),
    fs.readFileSync(
      "src/components/dashboard/ResolutionEvidenceSheet.module.css",
      "utf8"
    )
  ].join("\n");
  assert.doesNotMatch(css, /overflow-x:\s*auto/);
});

test("RT-43 motion is short and reduced-motion aware", () => {
  const css = fs.readFileSync(
    "src/components/dashboard/ResolutionEvidenceSheet.module.css",
    "utf8"
  );
  assert.match(css, /140ms/);
  assert.match(css, /180ms/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /\binfinite\b/);
});

test("RT-44 no new global navigation or route is introduced", () => {
  assert.equal(
    fs.existsSync(
      "src/app/(protected)/recovery-timeline/page.tsx"
    ),
    false
  );
});

test("RT-45 timeline is read-only proof, not a mutation surface", () => {
  const sources = [
    fs.readFileSync(
      "src/lib/recovery-timeline/server.ts",
      "utf8"
    ),
    fs.readFileSync(
      "src/components/dashboard/RecoveryTimeline.tsx",
      "utf8"
    ),
    fs.readFileSync(
      "src/components/dashboard/ResolutionEvidenceSheet.tsx",
      "utf8"
    )
  ].join("\n");
  assert.doesNotMatch(
    sources,
    /\.insert\(|\.update\(|\.delete\(|\.rpc\(/
  );
});
