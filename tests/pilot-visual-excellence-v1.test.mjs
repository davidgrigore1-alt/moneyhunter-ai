import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const experience = fs.readFileSync(
  "src/components/reports/PilotProofOfValueExperience.tsx",
  "utf8"
);
const proofCss = fs.readFileSync(
  "src/components/reports/PilotProofOfValue.module.css",
  "utf8"
);
const proposal = fs.readFileSync(
  "src/app/(protected)/reports/enterprise-pilot-pack/page.tsx",
  "utf8"
);
const proposalCss = fs.readFileSync(
  "src/components/reports/EnterprisePilotPackVisual.module.css",
  "utf8"
);
const core = fs.readFileSync(
  "src/lib/pilot-measurement-core.ts",
  "utf8"
);

test("PVX-01 stage rail explains all five stages", () => {
  for (const label of [
    "Definește pilotul",
    "Fixează situația inițială",
    "Rulează și monitorizează",
    "Măsoară rezultatele",
    "Analizează și decide"
  ]) {
    assert.match(experience, new RegExp(label));
  }
});

test("PVX-02 criteria expose one native info affordance", () => {
  assert.match(experience, /function MetricUnitGuide/);
  assert.match(experience, /<details className=\{styles\.unitGuide\}>/);
  assert.match(experience, /InformationCircleIcon/);
});

test("PVX-03 pp definition is precise and includes a concrete example", () => {
  assert.match(experience, /Puncte procentuale/);
  assert.match(experience, /60% → 80%/);
  assert.match(experience, /\+20 pp/);
});

test("PVX-04 case unit explains absolute opportunity count", () => {
  assert.match(experience, /Numărul absolut de oportunități din cohortă/);
  assert.match(experience, /reducere de 3 cazuri/);
});

test("PVX-05 record unit is explicitly not opportunity count or revenue", () => {
  assert.match(experience, /Numărul de acțiuni finalizate consemnate/);
  assert.match(experience, /Nu este un\s+număr de oportunități/);
  assert.match(experience, /nu reprezintă venit/);
});

test("PVX-06 unit help points to the canonical measurement definition", () => {
  assert.match(experience, /commercial-state-v1/);
  assert.match(core, /PILOT_DEFINITION_VERSION = "commercial-state-v1"/);
});

test("PVX-07 criteria retain exact server action field names", () => {
  for (const marker of [
    "criterion_${criterion.key}",
    "target_${criterion.key}",
    'name="cohort"',
    'name="scopeNote"'
  ]) {
    assert.ok(experience.includes(marker));
  }
});

test("PVX-08 criteria have plain-language descriptions before units", () => {
  for (const label of [
    "Diferența dintre procentul oportunităților cu responsabil",
    "următor pas definit la baseline și la final",
    "Cu câte oportunități scade numărul celor care au următorul pas restant",
    "fără activitate relevantă peste pragul pilotului",
    "acțiuni finalizate și consemnate"
  ]) {
    assert.match(experience, new RegExp(label));
  }
});

test("PVX-09 target values use a dedicated spacious metric capsule", () => {
  assert.match(proofCss, /\.target \{[\s\S]*?min-width: 176px/);
  assert.match(proofCss, /\.target \{[\s\S]*?min-height: 42px/);
  assert.match(proofCss, /\.target > span \{[\s\S]*?padding: 0 13px/);
});

test("PVX-10 form fields have deliberate internal padding", () => {
  assert.match(
    proofCss,
    /\.fieldGrid :global\(\.field\) \{[\s\S]*?padding-inline: 14px/
  );
  assert.match(
    proofCss,
    /textarea:global\(\.field\) \{[\s\S]*?padding: 12px 14px/
  );
});

test("PVX-11 cohort rows have comfortable minimum height and padding", () => {
  assert.match(proofCss, /\.cohort label \{[\s\S]*?min-height: 58px/);
  assert.match(proofCss, /\.cohort label \{[\s\S]*?padding: 13px 6px/);
});

test("PVX-12 final confirmation uses the premium confirmation surface", () => {
  const block = experience.slice(
    experience.indexOf("function FinalizePilot"),
    experience.indexOf("function ManagementDecision")
  );
  assert.match(block, /styles\.confirmationPanel/);
  assert.match(block, /styles\.confirmationCheck/);
  assert.match(block, /styles\.confirmationButton/);
});

test("PVX-13 managerial decision uses the same interaction pattern", () => {
  const block = experience.slice(
    experience.indexOf("function ManagementDecision"),
    experience.indexOf("function Setup")
  );
  assert.match(block, /styles\.confirmationPanel/);
  assert.match(block, /styles\.confirmationCheck/);
  assert.match(block, /styles\.confirmationButton/);
});

test("PVX-14 final confirmation checkbox remains required", () => {
  const block = experience.slice(
    experience.indexOf("function FinalizePilot"),
    experience.indexOf("function ManagementDecision")
  );
  assert.match(block, /required[\s\S]*?name="confirm"[\s\S]*?value="yes"/);
});

test("PVX-15 managerial confirmation checkbox remains required", () => {
  const block = experience.slice(
    experience.indexOf("function ManagementDecision"),
    experience.indexOf("function Setup")
  );
  assert.match(block, /required[\s\S]*?name="confirm"[\s\S]*?value="yes"/);
});

test("PVX-16 primary confirmation CTA has explicit high contrast", () => {
  assert.match(
    proofCss,
    /\.confirmationButton \{[\s\S]*?background: rgb\(var\(--intelligence\)\) !important/
  );
  assert.match(
    proofCss,
    /\.confirmationButton \{[\s\S]*?color: rgb\(var\(--background\)\) !important/
  );
});

test("PVX-17 checkbox and explanatory copy use a two-column alignment grid", () => {
  assert.match(
    proofCss,
    /\.confirmationCheck \{[\s\S]*?grid-template-columns: 18px minmax\(0, 1fr\)/
  );
  assert.match(
    proofCss,
    /\.confirmationCheck \{[\s\S]*?align-items: start/
  );
});

test("PVX-18 baseline confirmation gets the same readable checkbox treatment", () => {
  assert.match(experience, /styles\.inlineConfirmCheck/);
  assert.match(experience, /Am verificat baseline-ul/);
  assert.match(experience, /Domeniul, cohorta, criteriile și limitările/);
});

test("PVX-19 final action wording makes the requested decision explicit", () => {
  assert.match(experience, /Confirmă numai după ce ai verificat situația finală/);
  assert.match(experience, /Bifează confirmarea doar dacă/);
});

test("PVX-20 managerial action wording explains what closing does not mean", () => {
  assert.match(experience, /Nu înseamnă automat continuare comercială/);
  assert.match(experience, /nu transformă estimările în venit/);
});

test("PVX-21 setup top-level spacing is increased without card soup", () => {
  assert.match(proofCss, /\.setupSection \{[\s\S]*?padding: 28px 30px 30px 22px/);
  assert.match(proofCss, /\.setup \{[\s\S]*?border-radius: 20px/);
});

test("PVX-22 help popover is bounded and aligned to the trigger", () => {
  assert.match(proofCss, /\.unitGuide \{[\s\S]*?position: relative/);
  assert.match(proofCss, /\.unitGuidePanel \{[\s\S]*?right: 0/);
  assert.match(proofCss, /\.unitGuidePanel \{[\s\S]*?width: min\(430px/);
});

test("PVX-23 visual layer has no decorative gradient", () => {
  assert.doesNotMatch(proofCss, /linear-gradient|radial-gradient/);
  assert.doesNotMatch(proposalCss, /linear-gradient|radial-gradient/);
});

test("PVX-24 visual layer has no horizontal auto-scroll", () => {
  assert.doesNotMatch(proofCss, /overflow-x:\s*auto/);
  assert.doesNotMatch(proposalCss, /overflow-x:\s*auto/);
});

test("PVX-25 visual layer contains no looping animation", () => {
  assert.doesNotMatch(proofCss + proposalCss, /\binfinite\b/);
});

test("PVX-26 proposal route keeps its existing data loader", () => {
  assert.match(proposal, /getEnterprisePilotPack/);
  assert.match(proposal, /const pack = await getEnterprisePilotPack\(\)/);
});

test("PVX-27 proposal route receives only a visual wrapper class", () => {
  assert.match(proposal, /EnterprisePilotPackVisual\.module\.css/);
  assert.match(proposal, /styles\.root/);
  assert.match(proposal, /styles\.section/);
});

test("PVX-28 proposal sections use generous padding", () => {
  assert.match(proposalCss, /\.section \{[\s\S]*?padding: 27px 28px !important/);
});

test("PVX-29 proposal nested cards receive breathing room", () => {
  assert.match(
    proposalCss,
    /\.root :global\(\.rounded-card\) \{[\s\S]*?padding: 16px 17px !important/
  );
});

test("PVX-30 proposal keeps the black-white-champagne token system", () => {
  assert.match(proposalCss, /--intelligence/);
  assert.doesNotMatch(proposalCss, /#(?:00f|0000ff|008cff|007aff)/i);
});

test("PVX-31 Proof of Value still separates estimates from revenue", () => {
  assert.match(experience, /nu venit recuperat/);
  assert.match(experience, /Venit confirmat/);
  assert.match(experience, /Valoare estimată asociată/);
});

test("PVX-32 no new financial attribution or AI recommendation is added", () => {
  assert.doesNotMatch(
    experience,
    /recommendationScore|shouldContinue|recoveredRevenue|ROI cauzat/i
  );
});

test("PVX-33 no new provider or model call is introduced in visual components", () => {
  assert.doesNotMatch(
    experience,
    /openai|googleapis|messages\.send|drive\.files|fetch\s*\(/i
  );
});

test("PVX-34 no new persistence call is introduced in visual components", () => {
  assert.doesNotMatch(
    experience,
    /\.from\(|\.insert\(|\.update\(|\.delete\(|\.rpc\(/
  );
});

test("PVX-35 page remains responsive below 820px", () => {
  assert.match(proofCss, /@media \(max-width: 820px\)/);
  assert.match(
    proofCss,
    /\.criteriaSetup label \{[\s\S]*?grid-template-columns: 20px minmax\(0, 1fr\)/
  );
});

test("PVX-36 mobile confirmation controls become full-width and stacked", () => {
  assert.match(proofCss, /@media \(max-width: 640px\)/);
  assert.match(
    proofCss,
    /\.confirmationControls \{[\s\S]*?grid-column: 1 \/ -1/
  );
  assert.match(
    proofCss,
    /\.confirmationButton \{[\s\S]*?width: 100% !important/
  );
});

test("PVX-37 compact visual text never goes below 10.5px in the excellence layer", () => {
  const marker = proofCss.indexOf("PILOT_VISUAL_EXCELLENCE_V1");
  assert.ok(marker >= 0);
  const layer = proofCss.slice(marker);
  assert.doesNotMatch(layer, /font-size:\s*(?:6|7|8|9|10)(?:\.0)?px/);
});

test("PVX-38 confirmation CTA labels are exactly readable product language", () => {
  assert.match(experience, />\s*Confirmă situația finală\s*<ArrowRightIcon/);
  assert.match(experience, />\s*Închide pilotul\s*<ArrowRightIcon/);
});

test("PVX-39 criteria target inputs are no longer generic cramped field boxes", () => {
  const criteriaBlock = experience.slice(
    experience.indexOf('className={styles.criteriaSetup}'),
    experience.indexOf("</fieldset>", experience.indexOf('className={styles.criteriaSetup}'))
  );
  assert.doesNotMatch(criteriaBlock, /className="field"/);
  assert.match(criteriaBlock, /className=\{styles\.target\}/);
});

test("PVX-40 this sprint adds no route, migration or business-state mutation", () => {
  assert.equal(
    fs.existsSync("src/app/(protected)/pilot-visual-excellence/page.tsx"),
    false
  );
  const migrations = fs
    .readdirSync("supabase/migrations")
    .filter((name) => name.includes("pilot_visual_excellence"));
  assert.equal(migrations.length, 0);
});
