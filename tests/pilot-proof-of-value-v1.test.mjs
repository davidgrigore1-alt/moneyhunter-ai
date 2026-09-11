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
        Error
      },
      { filename: full }
    );

    return module.exports;
  };

  return load(entry);
}

const core = loadTs(
  path.join(ROOT, "src/lib/pilot-proof-recovery-core.ts")
);

function event(overrides = {}) {
  return {
    id: "event-1",
    domain: "execution",
    findingId: "finding-1",
    caseKey: "case-1",
    opportunityId: "opp-1",
    eventType: "detected",
    at: "2026-09-10T10:00:00.000Z",
    ...overrides
  };
}

function facts(overrides = {}) {
  return core.buildPilotRecoveryFacts({
    startAt: "2026-09-10T00:00:00.000Z",
    endAt: "2026-09-24T23:59:59.000Z",
    events: [],
    snapshotOpportunities: [
      {
        opportunityId: "opp-1",
        estimatedValue: 36000,
        currency: "RON"
      }
    ],
    ...overrides
  });
}

test("POV-01 rejects an invalid pilot window", () => {
  assert.throws(
    () =>
      facts({
        startAt: "2026-09-25T00:00:00.000Z",
        endAt: "2026-09-24T00:00:00.000Z"
      }),
    /pilot_recovery_invalid_window/
  );
});

test("POV-02 counts one tracked logical case across repeated events", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "event-2",
        eventType: "changed",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.trackedCaseCount, 1);
});

test("POV-03 counts two different logical cases separately", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "event-2",
        caseKey: "case-2",
        findingId: "finding-2"
      })
    ]
  });
  assert.equal(result.trackedCaseCount, 2);
});

test("POV-04 execution resolved event is a verified closure", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "resolve",
        eventType: "resolved",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.verifiedClosureCount, 1);
  assert.equal(result.sourceResolvedExecutionCount, 1);
});

test("POV-05 Context Integrity human decision is a verified closure", () => {
  const result = facts({
    events: [
      event({
        domain: "context_integrity",
        eventType: "detected"
      }),
      event({
        id: "decision",
        domain: "context_integrity",
        eventType: "resolution_recorded",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.verifiedClosureCount, 1);
  assert.equal(result.humanContextDecisionCount, 1);
});

test("POV-06 Context Integrity supersede is source-resolved, not a human decision", () => {
  const result = facts({
    events: [
      event({
        domain: "context_integrity",
        eventType: "detected"
      }),
      event({
        id: "supersede",
        domain: "context_integrity",
        eventType: "superseded",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.sourceResolvedContextCount, 1);
  assert.equal(result.humanContextDecisionCount, 0);
});

test("POV-07 repeated resolution transitions do not inflate unique closure count", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "r1",
        eventType: "resolved",
        at: "2026-09-11T10:00:00.000Z"
      }),
      event({
        id: "reopen",
        eventType: "reopened",
        at: "2026-09-12T10:00:00.000Z"
      }),
      event({
        id: "r2",
        eventType: "resolved",
        at: "2026-09-13T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.verifiedClosureCount, 1);
});

test("POV-08 reopened logical case is counted once", () => {
  const result = facts({
    events: [
      event({
        id: "reopen-1",
        eventType: "reopened"
      }),
      event({
        id: "reopen-2",
        eventType: "reopened",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.reopenedCount, 1);
});

test("POV-09 event outside the measurement window does not affect pilot metrics", () => {
  const result = facts({
    events: [
      event({
        eventType: "resolved",
        at: "2026-09-09T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.trackedCaseCount, 0);
  assert.equal(result.verifiedClosureCount, 0);
});

test("POV-10 resolution duration uses the preceding detected event", () => {
  const result = facts({
    events: [
      event({
        at: "2026-09-10T10:00:00.000Z"
      }),
      event({
        id: "resolve",
        eventType: "resolved",
        at: "2026-09-10T12:00:00.000Z"
      })
    ]
  });
  assert.equal(result.averageResolutionMinutes, 120);
});

test("POV-11 recurrence duration uses the latest reopen of that cycle", () => {
  const result = facts({
    events: [
      event({
        at: "2026-09-10T08:00:00.000Z"
      }),
      event({
        id: "first-close",
        eventType: "resolved",
        at: "2026-09-10T09:00:00.000Z"
      }),
      event({
        id: "reopen",
        eventType: "reopened",
        at: "2026-09-11T10:00:00.000Z"
      }),
      event({
        id: "final-close",
        eventType: "resolved",
        at: "2026-09-11T10:30:00.000Z"
      })
    ]
  });
  assert.equal(result.averageResolutionMinutes, 30);
});

test("POV-12 missing lifecycle start does not invent a duration", () => {
  const result = facts({
    events: [
      event({
        eventType: "resolved",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.equal(result.averageResolutionMinutes, null);
});

test("POV-13 associated opportunity value is counted once across several cases", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "other-case",
        caseKey: "case-2",
        findingId: "finding-2",
        eventType: "changed"
      })
    ]
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.associatedValueByCurrency)),
    [{ currency: "RON", value: 36000 }]
  );
});

test("POV-14 currencies remain separate", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "euro",
        caseKey: "case-eur",
        findingId: "finding-eur",
        opportunityId: "opp-2"
      })
    ],
    snapshotOpportunities: [
      {
        opportunityId: "opp-1",
        estimatedValue: 36000,
        currency: "RON"
      },
      {
        opportunityId: "opp-2",
        estimatedValue: 12000,
        currency: "EUR"
      }
    ]
  });
  assert.equal(result.associatedValueByCurrency.length, 2);
});

test("POV-15 missing or zero estimated value is not fabricated", () => {
  const result = facts({
    events: [event()],
    snapshotOpportunities: [
      {
        opportunityId: "opp-1",
        estimatedValue: null,
        currency: "RON"
      }
    ]
  });
  assert.equal(result.associatedValueByCurrency.length, 0);
});

test("POV-16 touched opportunity ids are deduplicated", () => {
  const result = facts({
    events: [
      event(),
      event({
        id: "event-2",
        eventType: "changed"
      })
    ]
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.touchedOpportunityIds)),
    ["opp-1"]
  );
});

test("POV-17 closed case keys are unique", () => {
  const result = facts({
    events: [
      event({
        eventType: "resolved"
      }),
      event({
        id: "resolved-again",
        eventType: "resolved",
        at: "2026-09-11T10:00:00.000Z"
      })
    ]
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.closedCaseKeys)),
    ["case-1"]
  );
});

test("POV-18 partial coverage flag is preserved", () => {
  const result = facts({ partial: true });
  assert.equal(result.partial, true);
});

test("POV-19 core contains no revenue attribution heuristic", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery-core.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /roi|attribution|recoveredRevenue|revenueRecovered/i
  );
});

test("POV-20 core contains no AI/model scoring", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery-core.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /openai|model|confidenceScore/i);
});

test("POV-21 recovery proof loader is server-only", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /^import "server-only";/);
});

test("POV-22 recovery proof derives the current business server-side", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /getCurrentBusinessForUser/);
  assert.match(source, /pilot_recovery_scope_forbidden/);
});

test("POV-23 pilot and snapshot scope must match", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /pilot_recovery_snapshot_scope_mismatch/);
  assert.match(source, /input\.snapshot\.pilotId !== input\.pilot\.id/);
});

test("POV-24 loader uses authenticated RLS client", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /createSupabaseServerClient/);
  assert.doesNotMatch(source, /createSupabaseAdminClient/);
});

test("POV-25 execution and context audit queries are cohort-scoped", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /execution_integrity_finding_events/);
  assert.match(source, /context_integrity_finding_events/);
  assert.ok(
    (source.match(/\.in\("opportunity_id", cohortIds\)/g) ?? [])
      .length >= 2
  );
});

test("POV-26 audit history queries are bounded", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /const EVENT_LIMIT = 600/);
  assert.match(source, /\.limit\(EVENT_LIMIT \+ 1\)/);
});

test("POV-27 partial query coverage is surfaced instead of hidden", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /queryPartial/);
  assert.match(source, /coverage: partial \? "partial" : "complete"/);
});

test("POV-28 resolved examples reuse the existing verified Recovery Timeline model", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(source, /getRecoveryTimeline/);
  assert.match(source, /closed\.has\(item\.caseKey\)/);
});

test("POV-29 historical example selection is confined to the pilot interval", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.match(
    source,
    /within\(item\.resolvedAt, input\.startAt, input\.endAt\)/
  );
});

test("POV-30 proof loader never reads source bodies", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /raw_source_text|external_document_segments|message_body|segment_text/i
  );
});

test("POV-31 proof loader never calls external providers or AI", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /openai|googleapis|gmail.*send|drive\.files|fetch\s*\(/i
  );
});

test("POV-32 proof layer is read-only", () => {
  const source = fs.readFileSync(
    "src/lib/pilot-proof-recovery.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /\.insert\(|\.update\(|\.delete\(|\.rpc\(/
  );
});

test("POV-33 page route is now a thin data loader", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/reports/pilot-proof-of-value/page.tsx",
    "utf8"
  );
  assert.match(page, /PilotProofOfValueExperience/);
  assert.doesNotMatch(page, /function Metric|function ComparisonView/);
});

test("POV-34 route preserves immutable baseline/final comparison", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/reports/pilot-proof-of-value/page.tsx",
    "utf8"
  );
  assert.match(page, /comparePilotSnapshots/);
  assert.match(page, /workspace\.baseline\.snapshot_payload/);
});

test("POV-35 recovery evidence starts at the frozen baseline", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/reports/pilot-proof-of-value/page.tsx",
    "utf8"
  );
  assert.match(
    page,
    /const proofStartAt = workspace\.baseline\?\.captured_at/
  );
});

test("POV-36 finalized pilots use the frozen final time as proof end", () => {
  const page = fs.readFileSync(
    "src/app/(protected)/reports/pilot-proof-of-value/page.tsx",
    "utf8"
  );
  assert.match(
    page,
    /workspace\.final\?\.captured_at \?\?/
  );
});

test("POV-37 experience preserves existing create/freeze/close server actions", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  for (const name of [
    "createPilotEngagement",
    "freezePilotBaseline",
    "freezePilotFinal",
    "closePilotEngagement"
  ]) {
    assert.match(component, new RegExp(name));
  }
});

test("POV-38 setup keeps exact server-action field names", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  for (const name of [
    'name="name"',
    'name="customerFacingName"',
    'name="startsOn"',
    'name="expectedEndsOn"',
    'name="scopeNote"',
    'name="cohort"'
  ]) {
    assert.ok(component.includes(name));
  }
  assert.match(component, /criterion_\$\{key\}/);
  assert.match(component, /target_\$\{key\}/);
});

test("POV-39 baseline and final confirmation still require explicit checkbox input", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.ok(
    (component.match(/name="confirm"/g) ?? []).length >= 3
  );
  assert.ok(
    (component.match(/required\s+type="checkbox"/g) ?? []).length >= 3
  );
});

test("POV-40 top narrative explicitly separates estimation from revenue", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.match(component, /fără ROI inventat/);
  assert.match(component, /nu venit recuperat/);
});

test("POV-41 final proof has four executive hero metrics", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  for (const label of [
    "Criterii îndeplinite",
    "Cazuri închise verificabil",
    "Decizii umane pe context",
    "Valoare estimată asociată"
  ]) {
    assert.match(component, new RegExp(label));
  }
});

test("POV-42 stage rail contains five understandable stages", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  for (const label of [
    "Contract",
    "Baseline",
    "Pilot",
    "Situație finală",
    "Decizie"
  ]) {
    assert.match(component, new RegExp(`label: "${label}"`));
  }
});

test("POV-43 final comparison is a clean list, not a horizontal table", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.doesNotMatch(component, /<table|<thead|<tbody/);
  assert.match(component, /className=\{styles\.changeRows\}/);
});

test("POV-44 verified recovery examples reuse Resolution Evidence", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotVerifiedRecovery.tsx",
    "utf8"
  );
  assert.match(component, /ResolutionEvidenceSheet/);
  assert.match(component, /Vezi dovada/);
});

test("POV-45 each verified recovery row has one button action", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotVerifiedRecovery.tsx",
    "utf8"
  );
  const article = component.match(
    /<article[\s\S]*?<\/article>/
  )?.[0] ?? "";
  assert.equal((article.match(/<button/g) ?? []).length, 1);
});

test("POV-46 design uses one restrained main hero rather than nested card soup", () => {
  const css = fs.readFileSync(
    "src/components/reports/PilotProofOfValue.module.css",
    "utf8"
  );
  assert.match(css, /\.hero \{/);
  assert.match(css, /border-radius: 18px/);
  assert.doesNotMatch(css, /\.card[0-9A-Za-z_-]*\s*\{/);
});

test("POV-47 design introduces no decorative gradient or glow", () => {
  const css = fs.readFileSync(
    "src/components/reports/PilotProofOfValue.module.css",
    "utf8"
  );
  assert.doesNotMatch(
    css,
    /linear-gradient|radial-gradient|drop-shadow|filter:\s*blur/i
  );
});

test("POV-48 design introduces no horizontal scrolling", () => {
  const css = fs.readFileSync(
    "src/components/reports/PilotProofOfValue.module.css",
    "utf8"
  );
  assert.doesNotMatch(css, /overflow-x:\s*auto/);
});

test("POV-49 primary narrative text stays comfortably readable", () => {
  const css = fs.readFileSync(
    "src/components/reports/PilotProofOfValue.module.css",
    "utf8"
  );
  assert.match(css, /\.heroDescription[\s\S]*?font-size: 14px/);
  assert.match(css, /\.sectionHeader > span[\s\S]*?font-size: 13px/);
  assert.match(css, /\.changeIdentity h3[\s\S]*?font-size: 13px/);
});

test("POV-50 no metadata text is below 9px", () => {
  const css = fs.readFileSync(
    "src/components/reports/PilotProofOfValue.module.css",
    "utf8"
  );
  assert.doesNotMatch(
    css,
    /font-size:\s*(?:6|7|8)(?:\.\d+)?px/
  );
});

test("POV-51 setup is intentionally three-step, not a dense wall of fields", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.equal(
    (component.match(/className=\{styles\.setupIndex\}/g) ?? []).length,
    3
  );
});

test("POV-52 limitations are progressive disclosure", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.match(component, /<details className=\{styles\.limitations\}>/);
  assert.match(component, /Metodologie și limitări/);
});

test("POV-53 final financial section keeps three concepts distinct", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  for (const label of [
    "Valoare estimată în cohortă",
    "Valoare estimată asociată cazurilor urmărite",
    "Venit confirmat"
  ]) {
    assert.match(component, new RegExp(label));
  }
});

test("POV-54 product never auto-recommends continue/stop from a score", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.doesNotMatch(
    component,
    /recommendationScore|autoRecommendation|shouldContinue|probability/i
  );
  assert.match(component, /Decizia finală rămâne umană/);
});

test("POV-55 no new pilot route or migration is introduced", () => {
  assert.equal(
    fs.existsSync(
      "src/app/(protected)/pilot-proof-of-value/page.tsx"
    ),
    false
  );
  const migrations = fs
    .readdirSync("supabase/migrations")
    .filter((name) => name.includes("pilot_proof_of_value_v1"));
  assert.equal(migrations.length, 0);
});

test("POV-56 print remains available only when a frozen final exists", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.match(
    component,
    /workspace\.final \? <PrintProofOfValueButton \/> : null/
  );
});

test("POV-57 visual evidence does not claim a resolved case equals revenue", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.match(
    component,
    /Închiderea unei rupturi comerciale demonstrează control/
  );
  assert.match(
    component,
    /Nu demonstrează singură că ReveNew a generat/
  );
});

test("POV-58 pilot evidence metrics distinguish execution closure from human context decisions", () => {
  const component = fs.readFileSync(
    "src/components/reports/PilotProofOfValueExperience.tsx",
    "utf8"
  );
  assert.match(component, /sourceResolvedExecutionCount/);
  assert.match(component, /humanContextDecisionCount/);
});

test("POV-59 visual surface has a reduced-motion safe disclosure", () => {
  const css = fs.readFileSync(
    "src/components/reports/PilotProofOfValue.module.css",
    "utf8"
  );
  assert.match(css, /prefers-reduced-motion/);
});

test("POV-60 package adds no model, autonomous action, or provider write", () => {
  const sources = [
    fs.readFileSync(
      "src/lib/pilot-proof-recovery-core.ts",
      "utf8"
    ),
    fs.readFileSync(
      "src/lib/pilot-proof-recovery.ts",
      "utf8"
    ),
    fs.readFileSync(
      "src/components/reports/PilotProofOfValueExperience.tsx",
      "utf8"
    )
  ].join("\n");

  assert.doesNotMatch(
    sources,
    /chat\.completions|responses\.create|messages\.send|gmail.*send|providerWrite/i
  );
});
