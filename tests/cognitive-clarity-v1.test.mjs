import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const copilot = fs.readFileSync(
  "src/components/intelligence/CopilotConversation.tsx",
  "utf8"
);
const copilotCss = fs.readFileSync(
  "src/components/intelligence/OperationalIntelligence.module.css",
  "utf8"
);
const evidence = fs.readFileSync(
  "src/components/intelligence/IntelligenceEvidence.tsx",
  "utf8"
);
const strip = fs.readFileSync(
  "src/components/commercial-truth/ContextIntegrityStrip.tsx",
  "utf8"
);
const stripCss = fs.readFileSync(
  "src/components/commercial-truth/ContextIntegrityStrip.module.css",
  "utf8"
);
const snapshot = fs.readFileSync(
  "src/components/commercial-truth/CommercialTruthSnapshot.tsx",
  "utf8"
);
const snapshotCss = fs.readFileSync(
  "src/components/commercial-truth/CommercialTruthSnapshot.module.css",
  "utf8"
);

const clarity = copilotCss.split("/* COPILOT_COGNITIVE_CLARITY_V1")[1] ?? "";
const ciClarity = stripCss.split("/* CONTEXT_INTEGRITY_CLARITY_V1")[1] ?? "";

test("CLARITY-01 comfortable density marker exists", () => {
  assert.ok(clarity);
});

test("CLARITY-02 executive headline is materially larger but drawer-safe", () => {
  assert.match(clarity, /font-size:\s*clamp\(22px,\s*2\.05vw,\s*26px\)/);
});

test("CLARITY-03 main answer copy is at least 14px", () => {
  assert.match(clarity, /\.fullAnswerText[\s\S]*?font-size:\s*14\.5px/);
  assert.match(clarity, /\.findingDetail[\s\S]*?font-size:\s*14\.5px/);
});

test("CLARITY-04 micro labels are no longer sub-10px in the clarity layer", () => {
  assert.doesNotMatch(clarity, /font-size:\s*(?:8|9)(?:\.\d+)?px/);
});

test("CLARITY-05 answer shell gains breathing room", () => {
  assert.match(clarity, /\.answerShell[\s\S]*?padding:\s*23px 24px 25px/);
});

test("CLARITY-06 full answer remains progressive disclosure", () => {
  assert.match(copilot, /<details className=\{styles\.fullAnswer\}>/);
  assert.doesNotMatch(copilot, /<details[^>]*open[^>]*className=\{styles\.fullAnswer\}/);
});

test("CLARITY-07 follow-ups are intentionally capped at two", () => {
  assert.match(copilot, /item\.answer\.followUps\.slice\(0, 2\)\.map/);
});

test("CLARITY-08 follow-up rows are more readable and spacious", () => {
  assert.match(clarity, /\.followUpAction[\s\S]*?min-height:\s*50px/);
  assert.match(clarity, /\.followUpLabel[\s\S]*?font-size:\s*13px/);
});

test("CLARITY-09 evidence rows have explicit readable content classes", () => {
  assert.match(evidence, /styles\.evidenceRowContent/);
  assert.match(evidence, /styles\.evidenceRowMeta/);
  assert.match(clarity, /\.evidenceRowContent[\s\S]*?font-size:\s*12\.5px/);
});

test("CLARITY-10 evidence remains collapsed by default", () => {
  assert.match(evidence, /<details>/);
  assert.doesNotMatch(evidence, /<details\s+open/);
});

test("CLARITY-11 snapshot exposes at most four executive facts", () => {
  assert.match(snapshot, /truth\.topFacts\.slice\(0, 4\)/);
});

test("CLARITY-12 executive metrics are a two-column scannable band", () => {
  assert.match(snapshotCss, /\.metrics[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(snapshotCss, /\.metric dd[\s\S]*?font-size:\s*14px/);
});

test("CLARITY-13 why block is decision-oriented", () => {
  assert.match(snapshot, /De ce contează/);
  assert.match(snapshot, /Ce faci acum/);
  assert.match(snapshot, /Context și dovezi/);
});

test("CLARITY-14 only the two highest-priority issues are expanded into decision blocks", () => {
  assert.match(snapshot, /visibleIssues\.slice\(0, 2\)/);
});

test("CLARITY-15 limitations are progressive disclosure", () => {
  assert.match(snapshot, /<details className=\{styles\.limitations\}>/);
});

test("CLARITY-16 secondary actions do not receive primary visual treatment", () => {
  assert.match(snapshotCss, /\.secondaryActions :global\(a\),[\s\S]*?background:\s*transparent !important/);
});

test("CLARITY-17 Context Integrity readability layer exists", () => {
  assert.ok(ciClarity);
});

test("CLARITY-18 Context Integrity core identity values are larger", () => {
  assert.match(ciClarity, /\.identity strong[\s\S]*?font-size:\s*14\.5px/);
  assert.match(ciClarity, /\.header h4[\s\S]*?font-size:\s*16px/);
});

test("CLARITY-19 human resolution options are comfortably readable", () => {
  assert.match(ciClarity, /\.option strong[\s\S]*?font-size:\s*12\.5px/);
  assert.match(ciClarity, /\.option small[\s\S]*?font-size:\s*11px/);
});

test("CLARITY-20 no horizontal scrolling is introduced", () => {
  assert.doesNotMatch(clarity, /overflow-x:\s*auto/);
  assert.doesNotMatch(ciClarity, /overflow-x:\s*auto/);
  assert.doesNotMatch(snapshotCss, /overflow-x:\s*auto/);
});

test("CLARITY-21 human-control semantics remain intact", () => {
  assert.match(strip, /Fără modificare automată/);
  assert.match(strip, /Consemnează decizia/);
});

test("CLARITY-22 no new visual effects or looping animation are added", () => {
  assert.doesNotMatch(clarity + ciClarity + snapshotCss, /\binfinite\b|radial-gradient|filter:\s*blur/);
});
