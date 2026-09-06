import { ArrowDownLeftIcon, ArrowUpRightIcon, CheckIcon, DocumentTextIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { ExcelMark } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import s from "./chapters.module.css";

export function WorkbookEvidence() {
  return <ChapterMotion name="evidence" className={s.evidenceLayout} duration={6500}>
    <div className={s.evidenceNarrative}>
      <p className={s.overline}>02 / Din concluzie, înapoi la fapt</p><h2>Din răspuns,<br />direct la sursă.</h2>
      <p className={s.lead}>O concluzie utilă poate fi verificată. Vezi fragmentul care o susține, în versiunea din care a fost extras.</p>
      <div className={s.conclusion} data-enter="1"><span className={s.miniLabel}>REVENew · Observație</span><h3>Revenirea promisă a trecut.</h3><p>În sursa citată lipsește continuarea.</p><a href="#workbook-range" className={s.citation} data-enter="2"><DocumentTextIcon aria-hidden="true" />Pipeline.xlsx <span>Oferte · A8:F8</span><ArrowUpRightIcon aria-hidden="true" /></a></div>
      <div className={s.evidenceReturn} data-enter="6"><ArrowDownLeftIcon aria-hidden="true" /><span>Același caz. O dovadă inspectabilă.</span></div>
    </div>
    <div className={s.workbook} data-enter="3" id="workbook-range" tabIndex={-1} role="region" aria-label="Dovadă ilustrativă din Pipeline.xlsx, Oferte, A8:F8">
      <div className={s.workbookHeader}><ExcelMark /><div><strong>Pipeline.xlsx</strong><p>Registru comercial</p></div><span className={s.sourceVersion} data-enter="5">Versiunea 3</span></div>
      <div className={s.sheetToolbar}><span>A8:F8</span><i aria-hidden="true">ƒx</i><p>Revenim până pe 4 septembrie pentru confirmarea următorului pas.</p><LockClosedIcon aria-hidden="true" /></div>
      <div className={s.sheetDesktop}>
        <table className={s.sheetTable}><caption className={s.srOnly}>Fragment ilustrativ. Rândul 8 este citat integral.</caption><colgroup>{[5,20,16,13,17,12,17].map((width,i)=><col key={i} style={{width:`${width}%`}} />)}</colgroup><thead><tr>{["", "A", "B", "C", "D", "E", "F"].map((v,i)=><th key={i} scope="col">{v}</th>)}</tr><tr><th scope="row">1</th>{["Companie","Subiect","Valoare RON","Responsabil","Revenire","Notă"].map(v=><th key={v} scope="col">{v}</th>)}</tr></thead><tbody>
          <tr className={s.mutedRow}><th scope="row">7</th>{Array.from({length:6},(_,i)=><td key={i}>…</td>)}</tr>
          <tr className={s.selectedRow} data-enter="4"><th scope="row">8</th><td>Atelier Nord</td><td>Mentenanță</td><td>42.000</td><td>Ana Popescu</td><td>04 sept.</td><td>Revenim până pe 4 septembrie…</td></tr>
          <tr className={s.mutedRow}><th scope="row">9</th><td>Meridian Systems</td><td>Licență</td><td>96.000</td><td>Radu Matei</td><td>—</td><td>În discuție</td></tr>
          <tr className={s.mutedRow}><th scope="row">10</th><td>Vector Industrial</td><td>Echipamente</td><td>180.000</td><td>Mihai Ionescu</td><td>—</td><td>De clarificat</td></tr>
          <tr className={s.mutedRow}><th scope="row">11</th><td>Altis Medical</td><td>Suport</td><td>72.000</td><td>Ana Popescu</td><td>—</td><td>Pas stabilit</td></tr>
        </tbody></table>
      </div>
      <dl className={s.sheetMobile} data-enter="4">{[["A8 · Companie","Atelier Nord"],["B8 · Subiect","Mentenanță"],["C8 · Valoare estimată","42.000 RON"],["D8 · Responsabil","Ana Popescu"],["E8 · Revenire","04 septembrie"]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className={s.sourceNote} data-enter="4"><span className={s.miniLabel}>F8 · Nota din sursă</span><blockquote>„Revenim până pe <mark>4 septembrie</mark> pentru confirmarea următorului pas.”</blockquote><p><CheckIcon aria-hidden="true" />Termen citat, nu dedus.</p></div>
      <div className={s.sheetTabs}><span>Oferte</span><span aria-hidden="true">+</span><small>Citire · A8:F8 · 6 celule citate</small></div>
    </div>
  </ChapterMotion>;
}
