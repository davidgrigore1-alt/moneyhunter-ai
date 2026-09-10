import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(
  "src/app/(protected)/dashboard/page.tsx",
  "utf8"
);
const center = fs.readFileSync(
  "src/components/dashboard/ExecutionControlCenter.tsx",
  "utf8"
);
const centerCss = fs.readFileSync(
  "src/components/dashboard/ControlCenter.module.css",
  "utf8"
);
const integrity = fs.readFileSync(
  "src/components/dashboard/ContextIntegrityRecoveryQueue.tsx",
  "utf8"
);
const integrityCss = fs.readFileSync(
  "src/components/dashboard/ContextIntegrityRecoveryQueue.module.css",
  "utf8"
);

test("RECOVERY-01 dashboard no longer stacks Context Integrity as a separate top-level surface", () => {
  assert.doesNotMatch(
    dashboard,
    /<ContextIntegrityRecoveryQueue\s+queue=\{contextIntegrityRecoveryQueue\}\s*\/>/
  );
});

test("RECOVERY-02 existing execution control center receives persistent integrity cases", () => {
  assert.match(
    dashboard,
    /contextIntegrityQueue=\{contextIntegrityRecoveryQueue\}/
  );
  assert.match(center, /contextIntegrityQueue\?: ContextIntegrityRecoveryQueueModel \| null/);
});

test("RECOVERY-03 the product presents one Commercial Recovery control surface", () => {
  assert.match(center, /Control Center · Commercial Recovery/);
  assert.match(center, /Ce necesită decizie acum/);
});

test("RECOVERY-04 the top message explicitly covers execution and context", () => {
  assert.match(
    center,
    /Execuție și context comercial care pot bloca următorul pas/
  );
});

test("RECOVERY-05 persistent integrity cases remain visibly distinct inside the same surface", () => {
  assert.match(center, /Integritate comercială/);
  assert.match(center, /Neconcordanțe persistente care trebuie clarificate/);
});

test("RECOVERY-06 execution cases retain their own operational lane", () => {
  assert.match(center, /Execuție comercială/);
  assert.match(center, /Situațiile care cer intervenție/);
});

test("RECOVERY-07 embedded integrity mode removes the duplicate large header", () => {
  assert.match(integrity, /embedded = false/);
  assert.match(integrity, /\{!embedded \? \(/);
});

test("RECOVERY-08 embedded mode limits visible integrity rows to two before disclosure", () => {
  assert.match(integrity, /Math\.min\(2, CONTEXT_INTEGRITY_RECOVERY_LIMITS\.visibleRows\)/);
  assert.match(integrity, /remainingItems/);
});

test("RECOVERY-09 embedded queue preserves the estimated-value boundary", () => {
  assert.match(
    integrity,
    /Valoarea afișată este estimată, nu venit recuperat/
  );
});

test("RECOVERY-10 no new Recovery route is introduced", () => {
  assert.equal(
    fs.existsSync("src/app/(protected)/recovery/page.tsx") ||
      fs.existsSync("src/app/(protected)/commercial-recovery/page.tsx"),
    false
  );
});

test("RECOVERY-11 convergence adds no horizontal scrolling", () => {
  const c = centerCss.split("/* COMMERCIAL_RECOVERY_CONVERGENCE_V1")[1] ?? "";
  const i = integrityCss.split("/* COMMERCIAL_RECOVERY_EMBEDDED_V1")[1] ?? "";
  assert.ok(c);
  assert.ok(i);
  assert.doesNotMatch(c + i, /overflow-x:\s*auto/);
});

test("RECOVERY-12 convergence introduces no new model, DB or provider semantics", () => {
  assert.doesNotMatch(center, /openai|googleapis|\.rpc\(|\.from\(/i);
  assert.doesNotMatch(integrity, /openai|googleapis|\.rpc\(|\.from\(/i);
});
