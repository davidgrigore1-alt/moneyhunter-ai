import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { ExcelMark } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import s from "./chapters.module.css";
export function WorkbookEvidence() {
 return <ChapterMotion name="evidence" className={s.evidenceLayout} duration={6000}>
  <div className={s.evidenceNarrative}><p className={s.overline}>05 / Verifică raționamentul</p><h2>Nu trebuie să crezi<br/>AI-ul pe cuvânt.</h2><p className={s.lead}>Din observație, ajungi la fragmentul care o susține. În versiunea folosită, cu termenul exact.</p><div className={s.conclusion} data-enter="1"><span className={s.miniLabel}>OBSERVAȚIE · ATELIER NORD</span><h3>Termenul promis a trecut.</h3><p>Continuarea trebuie verificată în sursele disponibile.</p><a href="#workbook-range" className={s.citation} data-enter="2"><DocumentTextIcon aria-hidden="true"/>Pipeline.xlsx · Oferte · A8:F8</a></div></div>
  <div className={s.evidenceInspector} id="workbook-range" tabIndex={-1} role="region" aria-label="Fragment citat din Pipeline.xlsx, rândul 8" data-enter="3"><div className={s.workbookHeader}><ExcelMark/><div><strong>Pipeline.xlsx</strong><p>Oferte · versiunea 3</p></div><span className={s.sourceVersion}>A8:F8</span></div><div className={s.exactRow} data-enter="4"><span className={s.rowNumber}>8</span><dl><div><dt>A · Companie</dt><dd>Atelier Nord</dd></div><div><dt>E · Revenire</dt><dd>04 septembrie</dd></div></dl></div><div className={s.exactNote} data-enter="4"><span>F8 · NOTA ORIGINALĂ</span><blockquote>„Revenim până pe <mark>4 septembrie</mark> pentru confirmarea următorului pas.”</blockquote></div><div className={s.evidenceMetadata} data-enter="5"><span>Termen citat, nu dedus.</span><span>Versiunea și intervalul rămân inspectabile.</span></div></div>
 </ChapterMotion>;
}
