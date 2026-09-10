import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync("src/components/intelligence/OperationalIntelligence.module.css", "utf8");
const component = fs.readFileSync("src/components/intelligence/CopilotConversation.tsx", "utf8");
const v2 = css.split("/* COPILOT_INTERFACE_V2")[1] ?? "";

test("Copilot V2 removes the horizontal-scroll suggestion rail", () => {
  assert.doesNotMatch(component, /styles\.suggestionRail/);
  assert.doesNotMatch(v2, /overflow-x:\s*auto/);
  assert.match(component, /styles\.suggestionList/);
});

test("Copilot root is width-bounded and clips accidental horizontal overflow", () => {
  assert.match(component, /styles\.conversationRoot/);
  assert.match(v2, /\.conversationRoot\s*\{[\s\S]*?max-width:\s*100%/);
  assert.match(v2, /\.conversationRoot\s*\{[\s\S]*?overflow-x:\s*hidden/);
});

test("question field has deliberate internal padding and its own focus treatment", () => {
  assert.match(component, /styles\.questionInput/);
  assert.match(v2, /\.questionInput\s*\{[\s\S]*?padding:\s*15px 16px/);
  assert.match(v2, /\.questionInput:focus\s*\{[\s\S]*?0 0 0 3px/);
});

test("outer composer no longer turns into a gold focus frame", () => {
  assert.match(v2, /\.composer:focus-within\s*\{[\s\S]*?border-color:\s*rgb\(var\(--foreground\)/);
  assert.doesNotMatch(v2, /\.composer:focus-within\s*\{[\s\S]*?border-color:\s*rgb\(var\(--intelligence\)/);
});

test("scope selection is a compact segmented control", () => {
  assert.match(component, /styles\.scopeControl/);
  assert.match(component, /styles\.scopeOption/);
  assert.match(v2, /\.scopeControl\s*\{[\s\S]*?border-radius:\s*12px/);
  assert.match(v2, /\.scopeOption\[aria-pressed="true"\]/);
});

test("starter questions are full-width single-line rows, not cards or horizontal chips", () => {
  assert.match(v2, /\.suggestionList\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(v2, /\.suggestion\s*\{[\s\S]*?width:\s*100%/);
  assert.match(v2, /\.suggestionLabel\s*\{[\s\S]*?white-space:\s*nowrap/);
  assert.match(v2, /\.suggestionLabel\s*\{[\s\S]*?text-overflow:\s*ellipsis/);
});

test("starter list uses one shared shell with row dividers", () => {
  assert.match(v2, /\.suggestionList\s*\{[\s\S]*?border-radius:\s*14px/);
  assert.match(v2, /\.suggestion\s*\{[\s\S]*?border-bottom:/);
  assert.match(v2, /\.suggestion:last-child\s*\{[\s\S]*?border-bottom:\s*0/);
});

test("answer mode is a compact capsule instead of an old rectangular button", () => {
  assert.match(v2, /\.answerMode\s*\{[\s\S]*?border-radius:\s*999px/);
});

test("V2 contains no decorative looping animation or gradient treatment", () => {
  assert.doesNotMatch(v2, /@keyframes|animation:/);
  assert.doesNotMatch(v2, /linear-gradient|radial-gradient/i);
});

test("V2 preserves reduced-motion behavior", () => {
  assert.match(v2, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(v2, /transition:\s*none/);
});
