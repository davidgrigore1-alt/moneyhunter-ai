"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CalendarDaysIcon, DocumentTextIcon, UserIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { qualify, type Qualification } from "@/lib/marketing/qualification";
import r from "./reference.module.css";

const groups = [
 { title:"Ce situație recunoști?", key:"process", options:[{value:"offers",label:"Oferte fără revenire"},{value:"handoff",label:"Predări între colegi"},{value:"renewals",label:"Reînnoiri"}] },
 { title:"Unde este contextul?", key:"context", options:[{value:"files",label:"Email + fișiere"},{value:"crm",label:"CRM"},{value:"mixed",label:"Mai multe sisteme"}] },
 { title:"Cine răspunde?", key:"team", options:[{value:"one",label:"Un responsabil"},{value:"several",label:"Mai mulți colegi"}] }
] as const;

export function QualificationRouter() {
 const [input,setInput]=useState<Qualification>({process:"offers",context:"files",team:"several"});
 const [submitted,setSubmitted]=useState<{input:Qualification; revision:number}|null>(null);
 const target=useRef<HTMLDivElement>(null);
 const result=submitted?qualify(submitted.input):null;
 const changed=!!submitted && groups.some(group=>input[group.key]!==submitted.input[group.key]);
 useEffect(()=>{
  if(!submitted)return;
  target.current?.focus({preventScroll:true});
  if (matchMedia("(max-width:600px)").matches) {
   target.current?.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});
  }
 },[submitted]);
 return <div className={r.router}>
  <form className={r.diagnostic} onSubmit={event=>{event.preventDefault();setSubmitted(previous=>({input:{...input},revision:(previous?.revision??0)+1}));}}>
   {groups.map((group,i)=><fieldset key={group.key}><legend><span>0{i+1}</span>{group.title}</legend><div className={r.choices}>{group.options.map(option=><label key={option.value}><input type="radio" name={group.key} value={option.value} checked={input[group.key]===option.value} onChange={()=>setInput(current=>({...current,[group.key]:option.value}))}/><span>{option.label}</span></label>)}</div></fieldset>)}
   <button className={r.diagnosticSubmit} type="submit">Arată-mi unde se poate rupe execuția <ArrowRightIcon aria-hidden="true"/></button>
   <p className={r.diagnosticNote} aria-live="polite">{changed?"Selecții modificate. Apasă pentru a actualiza explicația.":input.context==="files"?"Ghid orientativ · selecții locale, fără trimitere de date.":"Conectarea sistemelor se evaluează înainte de implementare."}</p>
  </form>
  <div className={r.fitResult} ref={target} tabIndex={-1} aria-labelledby="diagnostic-title" data-diagnostic-state={submitted?"result":"introduction"}>
   <div key={submitted?.revision??"introduction"} className={r.fitAnswer}>
    <span className={r.fitScenario}>{submitted?`${groups[0].options.find(option=>option.value===submitted.input.process)?.label} · ${submitted.input.context==="files"?"Email + fișiere":submitted.input.context==="crm"?"CRM":"Mai multe sisteme"} · ${submitted.input.team==="one"?"Un responsabil":"Echipă"}`:"Un reper pentru conducerea companiei"}</span>
    <h3 id="diagnostic-title" className={r.diagnosticTitle}>{submitted?"Unde merită să privești mai atent.":"Cât din continuitate depinde de memoria echipei?"}</h3>
    {!submitted&&<p className={r.fitIntro}>Când o ofertă, o promisiune sau un caz trece între sisteme și oameni, următorul pas poate deveni neclar.</p>}
    <div className={r.signalRibbon} aria-label="ReveNew urmărește patru repere">{[{Icon:CalendarDaysIcon,label:"Termen"},{Icon:UserIcon,label:"Responsabil"},{Icon:DocumentTextIcon,label:"Dovadă"},{Icon:ArrowRightIcon,label:"Pas următor"}].map(({Icon,label})=><span key={label}><Icon aria-hidden="true"/>{label}</span>)}</div>
    {result?<dl className={r.executiveAnswers}>
     <div><dt>De ce este relevant</dt><dd>{result.fit}</dd></div>
     <div><dt>Unde poate apărea ruptura</dt><dd>{result.risk}</dd></div>
     <div><dt>Ce ar vedea echipa</dt><dd>{result.prepare}</dd></div>
     <div><dt>Ce câștigă conducerea</dt><dd>{result.leadership}</dd></div>
    </dl>:<div className={r.fitInvitation}><strong>Identifică punctele în care se poate pierde firul.</strong><p>Alege situația din compania ta. Vezi unde ar putea apărea o ruptură și ce ar aduce ReveNew în atenția managementului.</p></div>}
    <div className={r.fitConclusion}><ShieldCheckIcon aria-hidden="true"/><strong>Decizia rămâne la echipa ta.</strong></div>
   </div>
  </div>
 </div>;
}
