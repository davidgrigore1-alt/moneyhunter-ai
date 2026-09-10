import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync("src/components/intelligence/OperationalIntelligence.module.css", "utf8");
const conversation = fs.readFileSync("src/components/intelligence/CopilotConversation.tsx", "utf8");
const evidence = fs.readFileSync("src/components/intelligence/IntelligenceEvidence.tsx", "utf8");
const snapshot = fs.readFileSync("src/components/commercial-truth/CommercialTruthSnapshot.tsx", "utf8");
const strip = fs.readFileSync("src/components/commercial-truth/ContextIntegrityStrip.tsx", "utf8");
const stripCss = fs.readFileSync("src/components/commercial-truth/ContextIntegrityStrip.module.css", "utf8");
const v51 = css.split("/* COPILOT_FINAL_VISUAL_QA_V51")[1] ?? "";

test("composer primary and secondary actions share exact geometry", () => {
  assert.match(conversation, /styles\.prepareButton/);
  assert.match(v51, /height:\s*42px/);
  assert.match(v51, /\.composerActions[\s\S]*?align-items:\s*center/);
});

test("composer remains container-safe at narrow drawer widths", () => {
  assert.match(v51, /@container \(max-width:\s*490px\)/);
  assert.match(v51, /@container \(max-width:\s*390px\)/);
  assert.doesNotMatch(v51, /overflow-x:\s*auto/);
});

test("ask again and response toolbar use low-chrome treatment", () => {
  assert.match(conversation, /styles\.askAgain/);
  assert.match(conversation, />Întreabă din nou</);
  assert.match(conversation, /styles\.responseToolbar/);
  assert.match(v51, /\.responseToolbar > p[\s\S]*?display:\s*none/);
});

test("executive hero is concise and moves facts into quiet metadata", () => {
  assert.match(conversation, /executiveHeadlineFor/);
  assert.match(conversation, /Contextul comercial necesită revizuire înainte de următorul pas\./);
  assert.match(conversation, /Oportunitatea necesită atenție: există o acțiune restantă\./);
  assert.match(conversation, /styles\.executiveMeta/);
});

test("signature Context Integrity strip is mounted only for real CI findings", () => {
  assert.match(snapshot, /ContextIntegrityStrip/);
  assert.match(strip, /item\.origin === "context_integrity"/);
  assert.match(strip, /truth\.contextIntegrity\?\.findings\.length/);
});

test("signature strip expresses the ReveNew decision flow", () => {
  for (const token of ["Context canonic", "Dovadă externă", "Conflict", "Decizie umană"]) {
    assert.match(strip, new RegExp(token));
  }
  assert.match(strip, /CRM · context curent/);
  assert.match(strip, /Document · client declarat/);
  assert.match(strip, /≠/);
  assert.match(strip, /Fără modificare automată/);
  assert.doesNotMatch(stripCss, /overflow-x:\s*auto/);
});

test("evidence language is simplified while coverage stays inspectable", () => {
  assert.match(evidence, /styles\.evidenceSummaryTitle/);
  assert.match(evidence, />Dovezi</);
  assert.match(evidence, /styles\.evidenceSummaryMeta/);
  assert.match(evidence, /styles\.coverageBlock/);
  assert.match(evidence, />Acoperirea analizei</);
});

test("follow ups are hairline rows without outer card chrome", () => {
  assert.match(v51, /\.followUpList\s*\{[\s\S]*?border:\s*0/);
  assert.match(v51, /\.followUpAction\s*\{[\s\S]*?border-bottom-color:/);
});

test("motion is short, one-shot and reduced-motion safe", () => {
  assert.match(v51, /revenewAnswerEnterV51 220ms/);
  assert.match(v51, /revenewFindingEnterV51 180ms/);
  assert.doesNotMatch(v51, /infinite/);
  assert.match(v51, /prefers-reduced-motion/);
});

test("V5.1 requires repaired CI runtime and canonical identity resolver", () => {
  const truth = fs.readFileSync("src/lib/commercial-truth.ts", "utf8");
  const adapter = fs.readFileSync("src/lib/context-integrity/commercial-truth-adapter.ts", "utf8");
  assert.match(truth, /contextIntegrity/);
  assert.match(truth, /origin:"context_integrity"/);
  assert.match(adapter, /isDeterministicContextIdentityAlias/);
});
