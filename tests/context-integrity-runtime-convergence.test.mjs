import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const truth = fs.readFileSync("src/lib/commercial-truth.ts", "utf8");
const server = fs.readFileSync("src/lib/commercial-truth-server.ts", "utf8");
const adapter = fs.readFileSync("src/lib/context-integrity/commercial-truth-adapter.ts", "utf8");
const snapshot = fs.readFileSync("src/components/commercial-truth/CommercialTruthSnapshot.tsx", "utf8");
const ci0 = fs.readFileSync("tests/context-integrity-ci0.test.mjs", "utf8");
const ci1 = fs.readFileSync("tests/context-integrity-ci1.test.mjs", "utf8");

test("CI repair restores the full CI-0 and CI-1 test manifests", () => {
  assert.equal(new Set(ci0.match(/CI0-\d{2}/g) ?? []).size, 70);
  assert.equal(new Set(ci1.match(/CI1-\d{2}/g) ?? []).size, 32);
});

test("Commercial Truth uses Context Integrity as association mismatch authority", () => {
  assert.match(truth, /buildOpportunityContextIntegrity/);
  assert.match(truth, /contextIntegrity/);
  assert.match(truth, /origin:"context_integrity"/);
  assert.doesNotMatch(truth, /normalize\(customerValue\)===normalize\(input\.companyName\)/);
});

test("server resolves customer declarations only inside the current tenant", () => {
  assert.match(server, /collectContextCustomerIdentityKeys/);
  assert.match(server, /\.eq\("business_id",actor\.businessId\)\.in\("normalized_name",declaredIdentityKeys\)/);
});

test("Drive revision reaches Context Integrity", () => {
  assert.match(server, /content_hash,provider_version/);
  assert.match(server, /sourceVersion:source\.content_hash\?\?source\.provider_version/);
});

test("adapter stays pure and human-review only", () => {
  assert.match(adapter, /buildOpportunityContextIntegrity/);
  assert.doesNotMatch(adapter, /\bfetch\s*\(|createSupabase|OPENAI|gmail\.send|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/i);
});

test("existing Commercial Truth snapshot exposes Context Integrity state", () => {
  assert.match(snapshot, /integrityCount/);
  assert.match(snapshot, /Integritatea contextului/);
});
