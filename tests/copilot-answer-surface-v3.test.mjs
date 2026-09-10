import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync("src/components/intelligence/OperationalIntelligence.module.css", "utf8");
const conversation = fs.readFileSync("src/components/intelligence/CopilotConversation.tsx", "utf8");
const evidence = fs.readFileSync("src/components/intelligence/IntelligenceEvidence.tsx", "utf8");
const v3 = css.split("/* COPILOT_ANSWER_SURFACE_V3")[1] ?? "";

test("answer V3 uses a dedicated premium response shell", () => {
  assert.match(conversation, /styles\.answerShell/);
  assert.match(conversation, /styles\.answerContent/);
  assert.match(v3, /\.answer\s*\{[\s\S]*?border-radius:\s*20px/);
});

test("question echo is quiet hierarchy, not another nested card", () => {
  assert.match(conversation, /styles\.questionEcho/);
  assert.match(conversation, /styles\.questionEyebrow/);
  assert.match(conversation, /styles\.questionText/);
  assert.match(v3, /\.questionEcho\s*\{[\s\S]*?border-bottom:/);
  assert.doesNotMatch(v3, /\.questionEcho\s*\{[\s\S]*?background:/);
});

test("executive answer typography is restrained for a side drawer", () => {
  assert.match(v3, /\.conclusion\s*\{[\s\S]*?font-size:\s*clamp\(17px,\s*1\.15vw,\s*20px\)/);
  assert.match(v3, /\.conclusion\s*\{[\s\S]*?line-height:\s*1\.43/);
});

test("long answer disclosure receives system-like row treatment", () => {
  assert.match(conversation, /styles\.fullAnswer/);
  assert.match(conversation, /styles\.fullAnswerText/);
  assert.match(v3, /\.fullAnswer > summary/);
});

test("finding rows use one subtle integrity marker instead of cards", () => {
  assert.match(conversation, /styles\.findingsSection/);
  assert.match(conversation, /styles\.findingRow/);
  assert.match(v3, /\.findingRow::before/);
});

test("inline evidence is capsule-style and remains width safe", () => {
  assert.match(evidence, /styles\.evidenceChipList/);
  assert.match(evidence, /styles\.evidenceChip/);
  assert.match(v3, /\.evidenceChip\s*\{[\s\S]*?max-width:\s*100%/);
  assert.match(v3, /\.evidenceChip\s*\{[\s\S]*?border-radius:\s*999px/);
});

test("expanded provenance uses clean source rows", () => {
  assert.match(evidence, /styles\.evidenceRow/);
  assert.match(evidence, /styles\.evidenceIndex/);
  assert.match(evidence, /styles\.evidenceInspect/);
});

test("follow-up actions become one compact grouped list without horizontal overflow", () => {
  assert.match(conversation, /styles\.followUpSection/);
  assert.match(conversation, /styles\.followUpList/);
  assert.match(conversation, /styles\.followUpAction/);
  assert.match(v3, /\.followUpLabel\s*\{[\s\S]*?text-overflow:\s*ellipsis/);
  assert.doesNotMatch(v3, /overflow-x:\s*auto/);
});

test("single suggested next action uses a capsule primary control", () => {
  assert.match(conversation, /styles\.answerPrimary/);
  assert.match(v3, /\.answerPrimary\s*\{[\s\S]*?border-radius:\s*999px/);
});

test("answer surface adds no decorative loop", () => {
  assert.doesNotMatch(v3, /@keyframes|animation:/);
});

test("answer surface remains responsive and reduced-motion aware", () => {
  assert.match(v3, /@media \(max-width:\s*640px\)/);
  assert.match(v3, /@media \(prefers-reduced-motion:\s*reduce\)/);
});
