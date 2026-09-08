import { ArrowRightIcon, DocumentTextIcon, UserIcon, ListBulletIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { ChapterMotion } from "./ChapterMotion";
import r from "./reference.module.css";

const rows = [
  { label: "Cazul", before: "Informația rămâne separată", after: "Context comercial unic", icon: DocumentTextIcon },
  { label: "Responsabilitatea", before: "Responsabil neclar", after: "Responsabil explicit", icon: UserIcon },
  { label: "Următorul pas", before: "Promisiune fără acțiune", after: "Pas pregătit", icon: ListBulletIcon },
  { label: "Rezultatul", before: "Estimarea nu este un rezultat", after: "Rezultat consemnat", icon: ChartBarIcon },
];

export function ReferenceComparison() {
  return <ChapterMotion name="comparison" duration={450}>
    <div className={r.comparison} data-enter="1">
      <div className={r.compareHead}><span>Fără ReveNew</span><span>Cu ReveNew</span></div>
      {rows.map(({label,before,after,icon:Icon}) => <div className={r.compareRow} key={label}>
        <div><Icon aria-hidden="true"/><span><strong>{label}</strong><p>{before}</p></span></div>
        <ArrowRightIcon aria-hidden="true"/>
        <div data-emphasis="true"><Icon aria-hidden="true"/><span><strong>{label}</strong><p>{after}</p></span></div>
      </div>)}
    </div>
    <ol className={r.processLine} aria-label="De la context la rezultat">{["Context","Ruptură","Dovezi","Responsabil","Pas","Decizie","Rezultat"].map(label=><li key={label}>{label}</li>)}</ol>
  </ChapterMotion>;
}
