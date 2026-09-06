"use client";
import { useState } from "react";
import { qualify, type Qualification } from "@/lib/marketing/qualification";
import s from "./commercial.module.css";
export function QualificationRouter() {
  const [input, setInput] = useState<Qualification>({process:"offers",context:"files",team:"several"});
  const [result, setResult] = useState<ReturnType<typeof qualify> | null>(null);
  function change<K extends keyof Qualification>(key: K, value: Qualification[K]) { setInput(previous => ({...previous,[key]:value})); setResult(null); }
  return <div className={s.router}>
    <div className={s.routerInputs}><span className={s.eyebrow}>PROCESUL TĂU · 3 ALEGERI</span>
      <label>Ce proces vrei să urmărești?<select value={input.process} onChange={event=>change("process",event.target.value as Qualification["process"])}><option value="offers">Oferte care cer revenire</option><option value="handoff">Predare între colegi</option><option value="renewals">Contracte și reînnoiri</option><option value="retail">Tranzacții instantanee</option></select></label>
      <label>Unde este informația?<select value={input.context} onChange={event=>change("context",event.target.value as Qualification["context"])}><option value="files">Emailuri și fișiere</option><option value="crm">În principal în CRM</option><option value="mixed">În mai multe sisteme</option></select></label>
      <label>Cine atinge procesul?<select value={input.team} onChange={event=>change("team",event.target.value as Qualification["team"])}><option value="several">Mai mulți colegi</option><option value="one">Un responsabil</option></select></label>
      <button type="button" onClick={()=>setResult(qualify(input))}>Vezi scenariul potrivit</button><p>Ghid orientativ cu reguli predefinite.<br/>Fără analiză AI sau transmitere de date.</p>
    </div>
    <div className={s.routerResult} aria-live="polite" aria-atomic="true">{result ? <><span className={s.eyebrow}>POTRIVIRE REVENew</span><h3>{result.fit}</h3><dl>{[["Riscul de urmărit",result.risk],["Sursele relevante",result.sources],["Ce ar scoate la vedere",result.reveal],["Ce ar pregăti",result.prepare],["Cine decide",result.decision],["Ce urmărim",result.outcome]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></> : <><span className={s.eyebrow}>DE LA PROCES LA UN CAZ CONCRET</span><h3>Unde se poate pierde<br/>următorul pas?</h3><p>Alege cum lucrează echipa ta. Vezi riscul de urmărit, informațiile necesare și propunerea pe care oamenii tăi ar primi-o.</p><ol><li>O situație de clarificat</li><li>Sursele care o pot explica</li><li>Un pas pregătit pentru echipă</li></ol><small>Potrivirea se confirmă pe procesul și datele convenite în prima discuție.</small></>}</div>
  </div>;
}
