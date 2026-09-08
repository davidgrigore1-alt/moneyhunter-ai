import { ArrowRightIcon, CheckCircleIcon, DocumentTextIcon, CircleStackIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import { ExcelMark } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import s from "./chapters.module.css";
import r from "./reference.module.css";

export function WorkbookEvidence() {
 return <ChapterMotion name="evidence" className={r.evidence} duration={500}>
  <div><p className={s.overline}>06 / Verifică recomandarea</p><h2>Nu trebuie să crezi<br/>AI-ul pe cuvânt.</h2><p className={r.evidenceLead}>Din observație, ajungi la fragmentul care o susține. În versiunea folosită, cu termenul exact.</p>
   <ul className={r.evidenceBenefits}>{[
    {title:"Dovadă directă",text:"Vezi exact fragmentul din sursă.",Icon:DocumentTextIcon},
    {title:"Termenul exact",text:"Expresia este evidențiată în context.",Icon:ChatBubbleBottomCenterTextIcon},
    {title:"Sursă și versiune vizibile",text:"Fișierul, foaia și intervalul rămân la vedere.",Icon:CircleStackIcon}
   ].map(({title,text,Icon})=><li key={title}><Icon aria-hidden="true"/><div><strong>{title}</strong><p>{text}</p></div></li>)}</ul>
   <div className={r.observation}><span>OBSERVAȚIE · ATELIER NORD</span><h3>Termenul promis a trecut.</h3><p>Continuarea trebuie verificată în sursele disponibile.</p><a href="#workbook-range"><DocumentTextIcon aria-hidden="true"/>Pipeline.xlsx · Oferte · A8:F8 <ArrowRightIcon aria-hidden="true"/></a></div>
  </div>
  <div className={r.evidenceDocument} id="workbook-range" tabIndex={-1} role="region" aria-label="Fragment citat din Pipeline.xlsx, rândul 8" data-enter="1">
   <header><ExcelMark/><div><strong>Pipeline.xlsx</strong><p>Oferte · versiunea 3</p></div><span>A8:F8</span></header>
   <div className={r.quote}><span>F8 · NOTA ORIGINALĂ</span><blockquote>„Revenim până pe <mark data-enter="3">4 septembrie</mark> pentru confirmarea următorului pas.”</blockquote></div>
   <div className={r.evidenceRow}><span>8</span><dl><div><dt>A · Companie</dt><dd>Atelier Nord</dd></div><div><dt>E · Revenire</dt><dd>04 septembrie</dd></div></dl></div>
   <div className={r.evidenceFoot}><CheckCircleIcon aria-hidden="true"/><div><strong>Termen citat, nu dedus.</strong><p>Versiunea și intervalul rămân inspectabile.</p></div></div>
   <details className={r.workbookDetails}><summary>Vezi în fișier <ArrowRightIcon aria-hidden="true"/></summary><div className={r.sheetRange}><div className={r.sheetChrome}>Pipeline.xlsx <span>Oferte · A8:F8 · v3</span></div><dl>{[["A8 · Companie","Atelier Nord"],["B8 · Ofertă","Contract de mentenanță"],["C8 · Valoare estimată","42.000 RON"],["D8 · Autorul ofertei","Ana Popescu"],["E8 · Revenire","04 septembrie"],["F8 · Notă","Revenim până pe 4 septembrie pentru confirmarea următorului pas."]].map(([cell,value])=><div key={cell}><dt>{cell}</dt><dd>{value}</dd></div>)}</dl><footer>Oferte <span>Interval demonstrativ · valori literale</span></footer></div></details>
  </div>
 </ChapterMotion>;
}
