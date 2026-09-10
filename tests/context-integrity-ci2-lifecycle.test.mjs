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
        for (const candidate of [resolved, resolved + ".ts", resolved + ".tsx", path.join(resolved, "index.ts")]) {
          if (fs.existsSync(candidate)) return load(candidate);
        }
      }
      return nativeRequire(id);
    };

    vm.runInNewContext(output, {
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
    }, { filename: full });

    return module.exports;
  };

  return load(entry);
}

const lifecycle = loadTs(
  path.join(ROOT, "src/lib/context-integrity/lifecycle.ts")
);

function evidence({
  sourceType = "document",
  sourceId = "doc-1",
  sourceVersion = "rev-1",
  title = "Contract",
  sourceSegmentId = "segment-1",
  excerpt
} = {}) {
  return {
    sourceType,
    sourceId,
    title,
    occurredAt: "2026-09-10T09:00:00.000Z",
    provider: sourceType === "document" ? "google_drive" : undefined,
    sourceDocumentId: sourceType === "document" ? sourceId : undefined,
    sourceSegmentId,
    sourceLocation: "liniile 1–3",
    sourceVersion,
    visibility: excerpt ? "authorized_content" : "metadata",
    ...(excerpt ? { excerpt } : {})
  };
}

function finding(overrides = {}) {
  return {
    key: "finding-rev-1",
    contractVersion: "context-integrity/0",
    businessId: "business-1",
    visibility: { scope: "business" },
    kind: "source_association_mismatch",
    subject: { type: "opportunity", canonicalId: "opp-1" },
    field: "customer_identity",
    severity: "high",
    evidenceStrength: "structured",
    state: "needs_review",
    reasonCode: "different_value_same_comparable_context",
    canonicalObservationId: "ci:crm:opp-1:customer_identity",
    conflictingObservationIds: ["ci:drive:doc-1:segment-1:customer_identity:a1"],
    evidence: [
      evidence({ sourceType: "opportunity", sourceId: "opp-1", sourceVersion: undefined, sourceSegmentId: undefined, title: "Opportunity" }),
      evidence({ sourceId: "doc-1", sourceVersion: "rev-1", excerpt: "Client: Vector Industrial" })
    ],
    safeAction: "review_association",
    ...overrides
  };
}

function snapshot(overrides = {}) {
  return {
    ...lifecycle.toContextIntegrityPersistentSnapshot({
      finding: finding(overrides.finding ?? {}),
      opportunityId: "opp-1",
      evaluatedAt: overrides.evaluatedAt ?? "2026-09-10T10:00:00.000Z"
    }),
    ...overrides.snapshot
  };
}

function existing({
  state = "needs_review",
  findingKey = "finding-rev-1",
  caseKey,
  rowVersion = 1,
  resolutionReason = null
} = {}) {
  const base = snapshot({
    snapshot: {
      findingKey,
      ...(caseKey ? { caseKey } : {})
    }
  });
  return {
    ...base,
    id: "persistent-1",
    state,
    rowVersion,
    detectionCount: 1,
    firstDetectedAt: "2026-09-10T10:00:00.000Z",
    lastDetectedAt: "2026-09-10T10:00:00.000Z",
    lastEvaluatedAt: "2026-09-10T10:00:00.000Z",
    resolutionReason,
    resolutionNote: null,
    resolvedByProfileId: state === "resolved" || state === "dismissed" ? "profile-1" : null,
    resolvedAt: state === "resolved" || state === "dismissed" ? "2026-09-10T10:05:00.000Z" : null
  };
}

test("CI2-01 case key is stable across source revision changes", () => {
  const a = lifecycle.deriveContextIntegrityCaseKey(finding());
  const b = lifecycle.deriveContextIntegrityCaseKey(
    finding({
      key: "finding-rev-2",
      evidence: [
        evidence({ sourceType: "opportunity", sourceId: "opp-1", sourceVersion: undefined, sourceSegmentId: undefined, title: "Opportunity renamed" }),
        evidence({ sourceId: "doc-1", sourceVersion: "rev-2", title: "Renamed contract" })
      ]
    })
  );
  assert.equal(a, b);
});

test("CI2-02 case key changes for a different document source", () => {
  const a = lifecycle.deriveContextIntegrityCaseKey(finding());
  const b = lifecycle.deriveContextIntegrityCaseKey(
    finding({
      evidence: [
        evidence({ sourceType: "opportunity", sourceId: "opp-1", sourceVersion: undefined, sourceSegmentId: undefined, title: "Opportunity" }),
        evidence({ sourceId: "doc-2" })
      ]
    })
  );
  assert.notEqual(a, b);
});

test("CI2-03 case key changes across tenant", () => {
  assert.notEqual(
    lifecycle.deriveContextIntegrityCaseKey(finding()),
    lifecycle.deriveContextIntegrityCaseKey(
      finding({ businessId: "business-2" })
    )
  );
});

test("CI2-04 case key changes across subject", () => {
  assert.notEqual(
    lifecycle.deriveContextIntegrityCaseKey(finding()),
    lifecycle.deriveContextIntegrityCaseKey(
      finding({ subject: { type: "opportunity", canonicalId: "opp-2" } })
    )
  );
});

test("CI2-05 case key changes across privacy visibility", () => {
  assert.notEqual(
    lifecycle.deriveContextIntegrityCaseKey(finding()),
    lifecycle.deriveContextIntegrityCaseKey(
      finding({
        visibility: {
          scope: "owner_private",
          ownerProfileId: "profile-1"
        }
      })
    )
  );
});

test("CI2-06 persisted evidence never stores authorized source body", () => {
  const persisted = lifecycle.minimizeContextIntegrityEvidence(
    finding().evidence
  );
  assert.equal(JSON.stringify(persisted).includes("Client: Vector Industrial"), false);
  assert.equal(persisted.some((item) => "excerpt" in item), false);
});

test("CI2-07 persisted evidence keeps source identity and revision", () => {
  const persisted = lifecycle.minimizeContextIntegrityEvidence(
    finding().evidence
  );
  const document = persisted.find((item) => item.sourceType === "document");
  assert.equal(document.sourceId, "doc-1");
  assert.equal(document.sourceRevision, "rev-1");
  assert.equal(document.sourceSegmentId, "segment-1");
});

test("CI2-08 new finding plans one create", () => {
  const detected = snapshot();
  const ops = lifecycle.planContextIntegrityReconciliation({
    existing: [],
    detected: [detected],
    coverageStatus: "complete",
    evaluatedAt: detected.evaluatedAt
  });
  assert.equal(ops.length, 1);
  assert.equal(ops[0].type, "create");
});

test("CI2-09 same snapshot is observed without reopening or resetting state", () => {
  const current = existing({ state: "dismissed" });
  const detected = snapshot({ snapshot: { caseKey: current.caseKey } });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [detected],
    coverageStatus: "complete",
    evaluatedAt: detected.evaluatedAt
  });
  assert.equal(op.type, "observe");
  assert.equal(op.preserveState, "dismissed");
});

test("CI2-10 changed snapshot refreshes a pending case", () => {
  const current = existing({ state: "needs_review" });
  const detected = snapshot({
    snapshot: {
      caseKey: current.caseKey,
      findingKey: "finding-rev-2"
    }
  });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [detected],
    coverageStatus: "complete",
    evaluatedAt: detected.evaluatedAt
  });
  assert.equal(op.type, "refresh");
});

test("CI2-11 changed snapshot reopens a resolved case", () => {
  const current = existing({ state: "resolved" });
  const detected = snapshot({
    snapshot: {
      caseKey: current.caseKey,
      findingKey: "finding-rev-2"
    }
  });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [detected],
    coverageStatus: "complete",
    evaluatedAt: detected.evaluatedAt
  });
  assert.equal(op.type, "reopen");
  assert.equal(op.previousState, "resolved");
});

test("CI2-12 changed snapshot reopens a dismissed case", () => {
  const current = existing({ state: "dismissed" });
  const detected = snapshot({
    snapshot: {
      caseKey: current.caseKey,
      findingKey: "finding-rev-2"
    }
  });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [detected],
    coverageStatus: "complete",
    evaluatedAt: detected.evaluatedAt
  });
  assert.equal(op.type, "reopen");
  assert.equal(op.previousState, "dismissed");
});

test("CI2-13 changed snapshot reopens a superseded case", () => {
  const current = existing({ state: "superseded" });
  const detected = snapshot({
    snapshot: {
      caseKey: current.caseKey,
      findingKey: "finding-rev-2"
    }
  });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [detected],
    coverageStatus: "complete",
    evaluatedAt: detected.evaluatedAt
  });
  assert.equal(op.type, "reopen");
  assert.equal(op.previousState, "superseded");
});

test("CI2-14 absent pending finding is superseded only with complete coverage", () => {
  const current = existing({ state: "needs_review" });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [],
    coverageStatus: "complete",
    evaluatedAt: "2026-09-10T11:00:00.000Z"
  });
  assert.equal(op.type, "supersede");
});

test("CI2-15 partial coverage holds absent finding fail-closed", () => {
  const current = existing({ state: "needs_review" });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [],
    coverageStatus: "partial",
    evaluatedAt: "2026-09-10T11:00:00.000Z"
  });
  assert.equal(op.type, "hold");
  assert.equal(op.reason, "coverage_not_complete");
});

test("CI2-16 insufficient coverage holds absent finding fail-closed", () => {
  const current = existing({ state: "needs_review" });
  const [op] = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [],
    coverageStatus: "insufficient",
    evaluatedAt: "2026-09-10T11:00:00.000Z"
  });
  assert.equal(op.type, "hold");
});

test("CI2-17 already resolved absent cases are not automatically rewritten", () => {
  const current = existing({ state: "resolved" });
  const ops = lifecycle.planContextIntegrityReconciliation({
    existing: [current],
    detected: [],
    coverageStatus: "complete",
    evaluatedAt: "2026-09-10T11:00:00.000Z"
  });
  assert.equal(ops.length, 0);
});

test("CI2-18 duplicate existing case keys fail closed", () => {
  const current = existing();
  assert.throws(
    () =>
      lifecycle.planContextIntegrityReconciliation({
        existing: [current, { ...current, id: "duplicate" }],
        detected: [],
        coverageStatus: "complete",
        evaluatedAt: "2026-09-10T11:00:00.000Z"
      }),
    /duplicate_case_key/
  );
});

test("CI2-19 duplicate detected case keys fail closed", () => {
  const detected = snapshot();
  assert.throws(
    () =>
      lifecycle.planContextIntegrityReconciliation({
        existing: [],
        detected: [detected, { ...detected }],
        coverageStatus: "complete",
        evaluatedAt: detected.evaluatedAt
      }),
    /duplicate_case_key/
  );
});

test("CI2-20 stale resolution inputs require a positive row version", () => {
  assert.throws(
    () =>
      lifecycle.validateContextIntegrityResolutionInput({
        expectedRowVersion: 0,
        expectedFindingKey: "finding",
        reason: "kept_current_context"
      }),
    /invalid_row_version/
  );
});

test("CI2-21 resolution note is bounded", () => {
  assert.throws(
    () =>
      lifecycle.validateContextIntegrityResolutionInput({
        expectedRowVersion: 1,
        expectedFindingKey: "finding",
        reason: "dismissed_with_reason",
        note: "x".repeat(1001)
      }),
    /note_too_long/
  );
});

test("CI2-22 resolution inputs preserve expected finding fingerprint", () => {
  const result = lifecycle.validateContextIntegrityResolutionInput({
    expectedRowVersion: 7,
    expectedFindingKey: "finding-rev-7",
    reason: "current_value_confirmed",
    note: "Verificat cu managerul comercial."
  });
  assert.equal(result.expectedRowVersion, 7);
  assert.equal(result.expectedFindingKey, "finding-rev-7");
});

test("CI2-23 SQL schema has one persistent case per business + case key", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /unique \(business_id, case_key\)/);
});

test("CI2-24 SQL schema requires human resolution metadata for resolved/dismissed", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /state not in \('resolved','dismissed'\)/);
  assert.match(sql, /resolved_by_profile_id is not null/);
  assert.match(sql, /resolved_at is not null/);
});

test("CI2-25 authenticated users receive read only table grants", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /grant select on table public\.context_integrity_findings to authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete).*context_integrity_findings to authenticated/);
});

test("CI2-26 service role can reconcile findings but cannot delete audit history", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /grant select, insert, update on table public\.context_integrity_findings to service_role/);
  assert.match(sql, /grant select, insert on table public\.context_integrity_finding_events to service_role/);
  assert.doesNotMatch(sql, /grant .*delete.*context_integrity_finding_events to service_role/);
});

test("CI2-27 owner-private findings do not broaden authenticated visibility", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /owner_profile_id = public\.current_profile_id\(\)/);
});

test("CI2-28 evidence snapshots are bounded to six metadata refs", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.match(sql, /jsonb_array_length\(evidence_refs\) <= 6/);
});

test("CI2-29 audit event table has no authenticated mutation policy", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/20260910150000_context_integrity_finding_lifecycle.sql",
    "utf8"
  ).toLowerCase();
  assert.doesNotMatch(sql, /context_integrity_events_(insert|update|delete)/);
});

test("CI2-30 lifecycle plan never chooses a CRM mutation or provider write action", () => {
  const source = fs.readFileSync(
    "src/lib/context-integrity/lifecycle.ts",
    "utf8"
  );
  assert.doesNotMatch(
    source,
    /\bfetch\s*\(|gmail\.send|googleapis|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/i
  );
});
