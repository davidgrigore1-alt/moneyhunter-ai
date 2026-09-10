import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync("src/components/intelligence/OperationalIntelligence.module.css", "utf8");
const conversation = fs.readFileSync("src/components/intelligence/CopilotConversation.tsx", "utf8");
const strip = fs.readFileSync("src/components/commercial-truth/ContextIntegrityStrip.tsx", "utf8");
const stripCss = fs.readFileSync("src/components/commercial-truth/ContextIntegrityStrip.module.css", "utf8");
const v52 = css.split("/* COPILOT_FINAL_MICRO_QA_V52")[1] ?? "";

test("composer trust line gets its own full-width row", () => {
  assert.match(conversation, /styles\.trustLine/);
  assert.match(conversation, /styles\.trustText/);
  assert.match(v52, /\.composerFooter\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(v52, /\.composerActions\s*\{[\s\S]*?justify-self:\s*end/);
});

test("trust copy cannot be squeezed into the old narrow left column", () => {
  assert.match(v52, /\.trustText\s*\{[\s\S]*?white-space:\s*nowrap/);
  assert.match(v52, /@container \(max-width:\s*330px\)[\s\S]*?clip-path:\s*inset\(50%\)/);
});

test("ask again is merged into the response toolbar with an overflow menu", () => {
  assert.doesNotMatch(
    conversation,
    /conversation\.length > 0 && !loading && !composerExpanded \? <button[^>]+styles\.askAgain/
  );
  assert.match(conversation, /styles\.responseToolbar/);
  assert.match(conversation, /styles\.askAgain/);
  assert.match(conversation, /styles\.responseMenu/);
  assert.match(conversation, /styles\.responseMenuPanel/);
  assert.match(conversation, /Mai multe opțiuni/);
});

test("delete conversation is no longer permanently exposed next to the answer", () => {
  assert.match(conversation, /styles\.responseMenuPanel[\s\S]*?Șterge conversația/);
});

test("overdue safe action gets the concise executive hero even without commercialTruth", () => {
  assert.match(
    conversation,
    /answer\.suggestedAction\?\.label === "Revizuiește acțiunea restantă"/
  );
  assert.match(
    conversation,
    /Oportunitatea necesită atenție: există o acțiune restantă\./
  );
});

test("generic opportunity-registered finding can be suppressed when it adds no decision value", () => {
  assert.match(conversation, /visibleFindingsFor/);
  assert.match(conversation, /Oportunitate înregistrată/);
  assert.match(conversation, /visibleFindingsFor\(item\.answer\)\.slice/);
});

test("untitled Drive evidence gets a product-facing fallback", () => {
  assert.match(strip, /Document Google Drive/);
  assert.match(strip, /Text export/);
  assert.match(strip, /evidenceLocation/);
});

test("Context Integrity inner comparison border is quieter", () => {
  assert.match(stripCss, /border:\s*1px solid rgb\(var\(--foreground\) \/ \.045\)/);
});

test("V5.2 adds no horizontal scroll or looping animation", () => {
  assert.doesNotMatch(v52, /overflow-x:\s*auto/);
  assert.doesNotMatch(v52, /infinite/);
});
