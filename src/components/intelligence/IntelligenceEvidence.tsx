"use client";
import { useState } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import styles from "./OperationalIntelligence.module.css";
import { EvidenceInspector } from "@/components/evidence/EvidenceInspector";
import controls from "@/components/ui/PremiumControls.module.css";
import type { CopilotAnswer, CopilotEvidence } from "@/lib/ai/copilot-types";
import { uniqueEvidenceSources } from "@/lib/ai/intelligence-evidence";
import { formatProductDateTime } from "@/lib/ui/presentation";

function freshSourceHref(route:string) {
  // A full navigation also rechecks authorization when the citation points at
  // the already-open document. An anchor-only jump would reuse its old page.
  const url=new URL(route,"https://revenew.invalid");
  url.searchParams.set("inspection",String(Date.now()));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function IntelligenceEvidence({answer, inline=false}: {answer:CopilotAnswer; inline?:boolean}) {
  const [selected,setSelected]=useState<CopilotEvidence|null>(null);
  const calculation=answer.calculations?.find(item=>item.id===selected?.sourceId);
  return <section className={inline?"mt-2":styles.evidence} aria-label={inline?"Dovezile afirmației":"Dovezi și acoperire"}>
    {inline?<div className={styles.evidenceChipList}>{answer.evidence.map(e=><button key={e.sourceId} type="button" onClick={()=>setSelected(e)} className={`focus-ring ${styles.evidenceChip}`} title={e.label}>{e.label}</button>)}</div>:<details>
    <summary className={`focus-ring ${styles.evidenceSummary}`}><span className={styles.evidenceSummaryContent}><span className={styles.evidenceSummaryTitle}><DocumentTextIcon aria-hidden="true" />Dovezi</span><span className={styles.evidenceSummaryMeta}>{uniqueEvidenceSources(answer.evidence)} {uniqueEvidenceSources(answer.evidence) === 1 ? "sursă" : "surse"}</span></span></summary>
    <ol className="mt-2 divide-y divide-[rgb(var(--border-subtle))]">{answer.evidence.map((e,index)=><li key={e.sourceId}><button type="button" onClick={()=>setSelected(e)} className={`focus-ring ${styles.evidenceRow}`}><span className={styles.evidenceIndex}>{index+1}</span><span className="min-w-0 flex-1 break-words">{e.label}<small>{e.sourceType} · {e.observedAt ? formatProductDateTime(e.observedAt) : "Data sursei indisponibilă"}</small></span><span className={styles.evidenceInspect}>Inspectează</span></button></li>)}</ol>
    {answer.checkedSources.length?<div className={styles.coverageBlock}><p className={styles.coverageTitle}>Acoperirea analizei</p><ul className={styles.coverageList}>{Array.from(new Map(answer.checkedSources.map(c=>[c.providerId,c])).values()).map(c=><li key={c.providerId}><strong className="font-medium">{c.label}</strong> · {c.state==="available"?"disponibil":c.state==="not_connected"?"neconectat":c.state==="forbidden"?"acces indisponibil":"indisponibil"}. {c.detail}</li>)}</ul></div>:null}
    </details>}
    {selected?<EvidenceInspector title={selected.label} fact={selected.fact} onClose={()=>setSelected(null)}
      metadata={[
        {label:"Semnificație",value:selected.provenance?.classification==="inference"?"Interpretare / comparație pentru revizuire":selected.provenance?.classification==="computed_result"?"Calcul determinist din sursă":selected.sourceType==="Document"?"Declarație a sursei; nu confirmare independentă":"Înregistrare autorizată"},
        {label:"Data sursei",value:selected.observedAt?formatProductDateTime(selected.observedAt):"Nedisponibilă"},
        ...(selected.provenance?[
          {label:"Recuperată",value:formatProductDateTime(selected.provenance.retrievedAt)},
          {label:"Versiune",value:selected.provenance.version??"Revizie observată"},
          {label:"Poziție",value:[selected.provenance.locator.sheet,selected.provenance.locator.row?`rând ${selected.provenance.locator.row}`:null,selected.provenance.locator.range].filter(Boolean).join(" · ")||"Înregistrarea citată"},
          {label:"Acoperire",value:selected.provenance.partial?"Parțială; consultă limitele răspunsului":"Proiecția autorizată"}
        ]:[])
      ]}
      boundary="Aceasta este dovada folosită la momentul analizei. Deschiderea sursei verifică din nou accesul curent."
      sourceAction={selected.route?<a href={freshSourceHref(selected.route)} className={`focus-ring mt-5 inline-flex min-h-10 items-center px-3 text-sm font-medium ${controls.secondary}`}>Deschide sursa autorizată →</a>:undefined}>
      {calculation?<div className="mt-5 border-t border-[rgb(var(--border))] pt-4 text-[13px]"><p>{calculation.rows.length} rânduri incluse · {calculation.exclusions} excluse</p><details className="mt-2"><summary className="focus-ring cursor-pointer py-2">Rândurile folosite în calcul</summary><ol className="max-h-52 space-y-1 overflow-y-auto">{calculation.rows.map(id=><li key={id}>{id.includes(":sheet:")?`Foaia ${Number(id.match(/:sheet:(\d+):/)?.[1])+1} · `:"CSV · "}rând {id.match(/:row:(\d+)$/)?.[1]??"înregistrat"}</li>)}</ol></details></div>:null}</EvidenceInspector>:null}
  </section>;
}
