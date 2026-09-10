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

const detector = loadTs(
  path.join(ROOT, "src/lib/execution-integrity/detector.ts")
);

function evidence(id, sourceType, sourceId, label) {
  return {
    id,
    sourceType,
    sourceId,
    label,
    observedAt: "2026-09-10T10:00:00.000Z",
    href: `/opportunities/opp-1#${sourceType}`
  };
}

function exception(code, options = {}) {
  const defaults = {
    overdue_next_action: {
      label: "Acțiune restantă",
      explanation: "Următoarea acțiune nu a fost finalizată până la termen.",
      severity: "critical",
      evidenceIds: ["action:action-1"],
      safeAction: {
        label: "Revizuiește acțiunea restantă",
        href: "/opportunities/opp-1#workflow-actions-list"
      }
    },
    missing_next_action: {
      label: "Fără acțiune următoare",
      explanation: "Oportunitatea deschisă nu are un pas următor confirmat.",
      severity: "attention",
      evidenceIds: ["opportunity:opp-1"],
      safeAction: {
        label: "Completează următoarea acțiune",
        href: "/opportunities/opp-1#action-schedule"
      }
    },
    unassigned_owner: {
      label: "Fără responsabil",
      explanation: "Oportunitatea nu este atribuită unui membru al echipei.",
      severity: "attention",
      evidenceIds: ["opportunity:opp-1"],
      safeAction: {
        label: "Atribuie responsabil",
        href: "/opportunities/opp-1#action-responsibility"
      }
    },
    pending_approval: {
      label: "Aprobare în așteptare",
      explanation: "Fluxul nu poate continua până la o decizie autorizată.",
      severity: "attention",
      evidenceIds: ["approval:approval-1"],
      safeAction: {
        label: "Verifică aprobarea",
        href: "/approvals?signal=approval-1"
      }
    },
    prepared_document_not_advanced: {
      label: "Document pregătit, pas final neconfirmat",
      explanation: "Există material comercial pregătit fără dovadă de utilizare.",
      severity: "attention",
      evidenceIds: ["document:doc-1"],
      safeAction: {
        label: "Revizuiește documentele",
        href: "/opportunities/opp-1#opportunity-documents"
      }
    }
  };

  return { code, ...defaults[code], ...options };
}

function state(overrides = {}) {
  return {
    businessId: "business-1",
    evaluatedAt: "2026-09-10T12:00:00.000Z",
    resolvedSinceDetection: [],
    opportunityId: "opp-1",
    title: "Program servicii corporate · Nova Medical",
    organization: { id: "org-1", name: "Nova Medical Systems SRL" },
    primaryContact: null,
    stage: "qualified",
    lifecycle: "open",
    financial: {
      estimatedValue: 15500,
      currency: "RON",
      confirmedRevenue: null,
      confirmedRevenueCurrency: null
    },
    ownership: {
      ownerProfileId: "profile-1",
      ownerName: "Irina Petrescu",
      validity: "confirmed"
    },
    activity: {
      lastMeaningfulActivityAt: null,
      inactivityDays: null
    },
    nextAction: {
      id: "action-1",
      title: "Confirmă criteriile de achiziție",
      dueAt: "2026-09-09T09:00:00.000Z",
      status: "pending",
      ownerProfileId: "profile-1",
      ownerName: "Irina Petrescu",
      overdue: true
    },
    flags: {
      nextActionMissing: false,
      nextActionOverdue: true,
      followUpOverdue: true,
      stale: false,
      blocked: false
    },
    approval: {
      state: "not_required",
      pendingCount: 0,
      signalId: null
    },
    document: {
      state: "none",
      id: null,
      title: null
    },
    outreach: { restricted: false, reason: null },
    response: { state: "none", category: null, respondedAt: null },
    communication: {
      lastInboundAt: null,
      lastOutboundAt: null,
      nextMeetingAt: null,
      responseWindowDays: 3
    },
    execution: {},
    outcome: {
      state: "open",
      confirmedByHuman: false,
      recordedAt: null
    },
    attention: {},
    exceptions: [exception("overdue_next_action")],
    evidence: [
      evidence(
        "opportunity:opp-1",
        "opportunity",
        "opp-1",
        "Oportunitatea Nova Medical"
      ),
      evidence(
        "action:action-1",
        "action",
        "action-1",
        "Confirmă criteriile de achiziție"
      )
    ],
    missingInformation: [],
    recommendedSafeIntervention: {
      label: "Revizuiește acțiunea restantă",
      href: "/opportunities/opp-1#workflow-actions-list"
    },
    humanDecisionRequired: true,
    auditReferences: [],
    ...overrides
  };
}

test("EI-01 detects an overdue next action", () => {
  const result = detector.buildExecutionIntegrityFindings(state());
  assert.equal(result.length, 1);
  assert.equal(result[0].code, "overdue_next_action");
  assert.equal(result[0].severity, "critical");
});

test("EI-02 overdue case key is stable when due date changes", () => {
  const a = detector.buildExecutionIntegrityFindings(state())[0];
  const b = detector.buildExecutionIntegrityFindings(
    state({
      nextAction: {
        ...state().nextAction,
        dueAt: "2026-09-08T09:00:00.000Z"
      }
    })
  )[0];
  assert.equal(a.caseKey, b.caseKey);
  assert.notEqual(a.findingKey, b.findingKey);
});

test("EI-03 a different overdue action stays the same logical opportunity/code case", () => {
  const a = detector.buildExecutionIntegrityFindings(state())[0];
  const b = detector.buildExecutionIntegrityFindings(
    state({
      nextAction: {
        ...state().nextAction,
        id: "action-2"
      },
      evidence: [
        evidence(
          "action:action-2",
          "action",
          "action-2",
          "Al doilea follow-up"
        )
      ]
    })
  )[0];
  assert.equal(a.caseKey, b.caseKey);
  assert.notEqual(a.findingKey, b.findingKey);
});

test("EI-04 case key changes across opportunities", () => {
  const a = detector.buildExecutionIntegrityFindings(state())[0];
  const b = detector.buildExecutionIntegrityFindings(
    state({ opportunityId: "opp-2" })
  )[0];
  assert.notEqual(a.caseKey, b.caseKey);
});

test("EI-05 case key changes across tenants", () => {
  const a = detector.buildExecutionIntegrityFindings(state())[0];
  const b = detector.buildExecutionIntegrityFindings(
    state({ businessId: "business-2" })
  )[0];
  assert.notEqual(a.caseKey, b.caseKey);
});

test("EI-06 closed opportunities emit no execution findings", () => {
  const findings = detector.buildExecutionIntegrityFindings(
    state({ lifecycle: "won" })
  );
  assert.equal(findings.length, 0);
});

test("EI-07 missing business scope fails closed", () => {
  assert.throws(
    () =>
      detector.buildExecutionIntegrityFindings(
        state({ businessId: undefined })
      ),
    /business_scope_required/
  );
});

test("EI-08 detects missing next action", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      nextAction: null,
      exceptions: [exception("missing_next_action")]
    })
  );
  assert.equal(result[0].code, "missing_next_action");
});

test("EI-09 detects unassigned owner", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      ownership: {
        ownerProfileId: null,
        ownerName: null,
        validity: "missing"
      },
      exceptions: [exception("unassigned_owner")]
    })
  );
  assert.equal(result[0].code, "unassigned_owner");
});

test("EI-10 detects pending approval only with a real approval source", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      approval: {
        state: "pending",
        pendingCount: 1,
        signalId: "approval-1"
      },
      exceptions: [exception("pending_approval")],
      evidence: [
        evidence(
          "approval:approval-1",
          "approval",
          "approval-1",
          "Aprobare în așteptare"
        )
      ]
    })
  );
  assert.equal(result[0].sourceType, "approval");
  assert.equal(result[0].sourceId, "approval-1");
});

test("EI-11 pending approval fails closed if source id is unavailable", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      approval: {
        state: "pending",
        pendingCount: 1,
        signalId: null
      },
      exceptions: [exception("pending_approval")]
    })
  );
  assert.equal(result.length, 0);
});

test("EI-12 detects prepared document not advanced", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      document: {
        state: "prepared",
        id: "doc-1",
        title: "Ofertă"
      },
      exceptions: [
        exception("prepared_document_not_advanced")
      ],
      evidence: [
        evidence(
          "document:doc-1",
          "document",
          "doc-1",
          "Ofertă pregătită"
        )
      ]
    })
  );
  assert.equal(result[0].sourceType, "document");
});

test("EI-13 unsupported low-value completeness warnings do not become persistent execution cases", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      exceptions: [
        {
          code: "missing_expected_date",
          label: "Termen comercial lipsă",
          explanation: "Lipsește termenul.",
          severity: "informative",
          evidenceIds: ["opportunity:opp-1"],
          missingInformation: [],
          rule: "opportunities.deadline",
          safeAction: {
            label: "Revizuiește oportunitatea",
            href: "/opportunities/opp-1"
          }
        }
      ]
    })
  );
  assert.equal(result.length, 0);
});

test("EI-14 proposal-without-follow-up is not duplicated beside missing-next-action", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      nextAction: null,
      exceptions: [
        exception("missing_next_action"),
        {
          code: "proposal_without_follow_up",
          label: "Propunere fără follow-up",
          explanation: "Lipsește follow-up-ul.",
          severity: "attention",
          evidenceIds: ["opportunity:opp-1"],
          missingInformation: [],
          rule: "opportunity_actions.status",
          safeAction: {
            label: "Completează următoarea acțiune",
            href: "/opportunities/opp-1#action-schedule"
          }
        }
      ]
    })
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].code, "missing_next_action");
});

test("EI-15 evidence snapshot stores metadata, not source bodies", () => {
  const result = detector.buildExecutionIntegrityFindings(state())[0];
  const serialized = JSON.stringify(result.evidenceRefs);
  assert.doesNotMatch(serialized, /rawSourceText|excerpt|body/i);
});

test("EI-16 safe actions remain internal relative paths", () => {
  const result = detector.buildExecutionIntegrityFindings(state())[0];
  assert.ok(result.safeActionHref.startsWith("/"));
});

test("EI-17 overdue execution breaks rank before ownership breaks", () => {
  const result = detector.buildExecutionIntegrityFindings(
    state({
      ownership: {
        ownerProfileId: null,
        ownerName: null,
        validity: "missing"
      },
      exceptions: [
        exception("unassigned_owner"),
        exception("overdue_next_action")
      ]
    })
  );
  assert.equal(result[0].code, "overdue_next_action");
});

test("EI-18 age is whole-day and non-negative", () => {
  assert.equal(
    detector.executionIntegrityAgeDays(
      "2026-09-08T10:00:00.000Z",
      new Date("2026-09-10T12:00:00.000Z")
    ),
    2
  );
  assert.equal(
    detector.executionIntegrityAgeDays(
      "2026-09-12T10:00:00.000Z",
      new Date("2026-09-10T12:00:00.000Z")
    ),
    0
  );
});

test("EI-19 repository uses one service-side workspace reconciliation RPC", () => {
  const source = fs.readFileSync(
    "src/lib/execution-integrity/repository.ts",
    "utf8"
  );
  assert.match(source, /createSupabaseAdminClient/);
  assert.match(source, /reconcile_execution_integrity_workspace_v1/);
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(/);
});

test("EI-20 authenticated server loader reads only active scoped cases", () => {
  const source = fs.readFileSync(
    "src/lib/execution-integrity/server.ts",
    "utf8"
  );
  assert.match(source, /requirePermission\("opportunities\.read"\)/);
  assert.match(source, /createSupabaseServerClient/);
  assert.match(source, /\.eq\("state", "open"\)/);
  assert.match(source, /\.in\("opportunity_id", ids\)/);
});

test("EI-21 server loader derives findings from current deterministic commercial state", () => {
  const source = fs.readFileSync(
    "src/lib/execution-integrity/server.ts",
    "utf8"
  );
  assert.match(source, /buildOpportunityCommercialState/);
  assert.match(source, /buildExecutionIntegrityFindings/);
});

test("EI-22 server loader never reads provider/source bodies", () => {
  const source = fs.readFileSync(
    "src/lib/execution-integrity/server.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /external_document_segments|rawSourceText|googleapis|gmail|fetch\s*\(/i
  );
});

test("EI-23 SQL state can only be open or source-resolved", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /state in \('open','resolved'\)/);
});

test("EI-24 SQL provides no authenticated mutation grants", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(
    sql,
    /grant select on table public\.execution_integrity_findings\s+to authenticated/
  );
  assert.doesNotMatch(
    sql,
    /grant (insert|update|delete).*execution_integrity_findings[\s\S]*to authenticated/
  );
});

test("EI-25 reconciliation RPC is service-role only", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(
    sql,
    /revoke all on function public\.reconcile_execution_integrity_workspace_v1[\s\S]*from public, anon, authenticated/
  );
  assert.match(
    sql,
    /grant execute on function public\.reconcile_execution_integrity_workspace_v1[\s\S]*to service_role/
  );
});

test("EI-26 RPC validates opportunity tenant scope", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(
    sql,
    /opportunity\.business_id = target_business_id/
  );
});

test("EI-27 same exact finding increments detection count without audit spam", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  const observed = sql.match(
    /if current_row\.finding_key = finding_key_value[\s\S]*?continue;/
  )?.[0] ?? "";
  assert.match(observed, /detection_count = detection_count \+ 1/);
  assert.doesNotMatch(observed, /insert into public\.execution_integrity_finding_events/);
});

test("EI-28 changed source snapshot increments row version", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /row_version = row_version \+ 1/);
  assert.match(sql, /'changed'/);
});

test("EI-29 absent finding resolves only under complete evaluation", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /if coverage_complete then/);
  assert.match(sql, /state = 'resolved'/);
});

test("EI-30 incomplete evaluation holds open cases fail-closed", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /into count_held/);
});

test("EI-31 resolved recurring break reopens instead of creating a duplicate case", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /current_row\.state = 'resolved'/);
  assert.match(sql, /'reopened'/);
  assert.match(sql, /unique \(business_id, case_key\)/);
});

test("EI-32 audit events cannot be deleted by service role", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(
    sql,
    /grant select, insert on table public\.execution_integrity_finding_events\s+to service_role/
  );
  assert.doesNotMatch(
    sql,
    /grant .*delete.*execution_integrity_finding_events.*service_role/
  );
});

test("EI-33 regular members can read only owned-opportunity execution cases", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(
    sql,
    /opportunity\.owner_profile_id = public\.current_profile_id\(\)/
  );
});

test("EI-34 RPC rejects evidence fields outside the metadata allowlist", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.match(
    sql,
    /execution integrity evidence contains disallowed fields/
  );
});

test("EI-35 no human dismissal or fake completion RPC is introduced", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.doesNotMatch(
    sql,
    /dismiss_execution_integrity|resolve_execution_integrity_finding/
  );
});

test("EI-36 execution persistence never mutates opportunity/action/source state", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910190000_execution_integrity_v1.sql",
    "utf8"
  ).toLowerCase();
  assert.doesNotMatch(
    sql,
    /update public\.opportunities|update public\.opportunity_actions|update public\.commercial_signals|update public\.opportunity_documents/
  );
});
