import { assertJsx } from "./helpers/jsx-contract.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

test("A4.5 reports use the shared factual summary and semantic distribution table", () => {
  const reports = read("src/app/(protected)/reports/page.tsx");

  assertJsx(reports, "PageShell", { wide: true });
  assert.match(reports, /<RecordSummaryBar label="Adevărul executiv al raportului"/);
  assert.match(reports, /Nu este venit confirmat\./);
  assertJsx(reports, "StageDistribution", { stages: "reportDistribution", total: "opportunities.length" });
  const distribution = read("src/components/reports/StageDistribution.tsx");
  assertJsx(distribution, "table");
  assertJsx(distribution, "caption");
  assertJsx(distribution, "th", { scope: "row" });
  assert.match(distribution, /Estimări RON; monedele diferite nu sunt cumulate/);
});

test("A4.5 pilot proof retains explicit truth boundaries and semantic comparison", () => {
  const pilot = read("src/app/(protected)/reports/pilot-proof-of-value/page.tsx");

  assert.match(pilot, /Baseline imuabil, aceeași cohortă/);
  assert.match(pilot, /Pilotul nu demonstrează că ReveNew a cauzat venit/);
  assert.match(pilot, /<caption className="sr-only">Comparația criteriilor pilotului/);
  assert.match(pilot, /<th scope="row" className="p-3 text-left font-semibold">/);
});

test("A4.5 Apps presents compact provider rows without upgrading planned states", () => {
  const hub = read("src/components/apps/IntegrationHub.tsx");
  const catalog = read("src/components/apps/IntegrationCatalog.tsx");

  assertJsx(hub, "PageShell", { wide: true });
  assert.match(hub, /Etichetele descriu[\s\S]*disponibilitatea reală/);
  assertJsx(catalog, "AvailableSources", { state: "state" });
  assertJsx(catalog, "section", { "aria-label": "Evaluare înainte de implementare" });
  assert.match(catalog, /item\.stage !== "implemented"/);
  assertJsx(catalog, "button", { type: "button", "aria-haspopup": "dialog", onClick: /onSelect\(item\)/ });
  assert.match(catalog, /nu sunt integrări active/);
});

test("A4.5 Settings keeps quiet grouped navigation and names the active scope", () => {
  const settings = read("src/app/(protected)/settings/page.tsx");

  assert.match(settings, /<PageShell\s+wide/);
  assert.match(settings, /Configurezi spațiul de lucru/);
  assert.match(settings, /Spațiu de lucru/);
  assert.match(settings, /Operare/);
  assert.match(settings, /Administrare/);
  assert.match(settings, /Utilizarea va fi afișată după activarea măsurării dedicate/);
  assert.match(settings, /Microsoft 365[\s\S]*În pregătire/);
});
