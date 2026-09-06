import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

test("landing presents an evidence-led and human-controlled commercial path", () => {
  const landing = read("src/app/(marketing)/page.tsx");
  const visuals = ["LandingChapters", "LandingVisuals", "ProductTheatre", "WorkbookEvidence", "WorkflowDemo"].map(name => read(`src/components/marketing/${name}.tsx`)).join("\n");
  const source = `${landing}\n${visuals}`;

  assert.match(source, /Scenariu de prezentare · companii și valori de exemplu/);
  assert.match(source, /Revizuire necesară/);
  assert.match(source, /Nu o încasare verificată/);
  assert.match(source, /Analiza și pregătirea nu trimit mesaje/);
  assert.match(source, /Google Workspace: de validat la conectare/);
  assert.match(source, /Conectorii din această bandă nu sunt implementați/);
  assert.match(source, /fără a implica un parteneriat/);
  assert.doesNotMatch(source, /ROI garantat|venit garantat|recuperare automată|Inteligență AI/i);
  assert.doesNotMatch(source, /live Gmail|live Google Calendar|voce activă/i);
});

test("landing workflow and relationship visuals preserve visible human-controlled semantics", () => {
  const visuals = read("src/components/marketing/WorkflowDemo.tsx");
  const styles = read("src/components/marketing/chapters.module.css");

  for (const label of ["Revenire după termen", "Dovada este asociată", "Context suficient?", "Revenire pregătită", "Revizuire umană", "Cere context"]) assert.ok(visuals.includes(label));
  assert.match(visuals, /Propunere editabilă/);
  assert.match(visuals, /Alternative posibile, încă neselectate/);
  assert.match(visuals, /Așteaptă verificarea și decizia Anei/);
  assert.match(styles, /\.engineGraph/);
  assert.match(styles, /\.enginePortIn/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(visuals, /Email sent|Sequence launched|Automatically executed/);
});

test("visual system keeps the Attio-led foundation restrained while using a branded evidence rail", () => {
  const globals = read("src/app/globals.css");
  const aiPage = read("src/app/(protected)/ai/page.tsx");

  assert.match(globals, /Controlled accent roles/);
  assert.match(globals, /--rn-accent-500: 76 151 129/);
  assert.match(globals, /--focus-ring: var\(--rn-accent-ring\)/);
  assert.match(globals, /--brand-500: var\(--rn-accent-500\)/);
  assert.match(globals, /\.ai-evidence-rail/);
  assert.match(aiPage, /ai-evidence-rail/);
  assert.match(aiPage, /Vezi de ce/);
  assert.match(aiPage, /Verifică dovada/);
  assert.match(aiPage, /Nicio comunicare externă nu este trimisă automat/);
});

test("access and core buyer surfaces retain safe Romanian copy", () => {
  const access = read("src/app/(account)/access/page.tsx");
  const dashboard = read("src/app/(protected)/dashboard/page.tsx");
  const reports = [
    read("src/app/(protected)/reports/revenue-recovery-audit/page.tsx"),
    read("src/app/(protected)/reports/enterprise-pilot-pack/page.tsx"),
    read("src/app/(protected)/reports/pilot-proof-of-value/page.tsx")
  ].join("\n");

  assert.doesNotMatch(access, /Workspace|ownership|pending/i);
  assert.match(access, /Nicio opțiune nu promite rezultate garantate/);
  assert.match(dashboard, /HomeAskSurface/);
  assert.doesNotMatch(dashboard, /MetricCard|venit confirmat|valoare estimată/i);
  assert.match(reports, /aprobare umană|control uman/i);
  assert.doesNotMatch(reports, /ROI garantat|venit garantat|recuperare automată/i);
});
