import Image from "next/image";
import { ArrowRightIcon, CheckIcon, DocumentTextIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, ExcelMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import { revenueExample as result } from "@/lib/marketing/revenue-example";
import { AccessRole } from "./AccessRole";
import s from "./chapters.module.css";

export function CommercialThread() {
  return <ChapterMotion name="commercial-thread" className={s.commercialScene} duration={8800}>
    <div className={s.offerContext}>
      <div className={s.caseIdentity}><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div></div>
      <div className={s.requestLine}><Image src="/brands/google/gmail.svg" width={20} height={20} alt="Gmail"/><span>01 septembrie · „Ne puteți trimite o ofertă?”</span></div><div className={s.offerPaper} data-enter="1"><span><DocumentTextIcon aria-hidden="true" />Ofertă trimisă · 02 septembrie</span><strong>42.000 <small>RON</small></strong><p>Valoarea estimată a ofertei</p><div><PersonAvatar />Ana Popescu</div></div>
      <div className={s.promiseLine} data-enter="2"><ExcelMark /><div><small>Pipeline.xlsx · F8</small><p>„Revenim până pe 4 septembrie.”</p></div></div>
      <div className={s.commercialGap} data-enter="3"><time dateTime="2026-09-06">06 septembrie</time><span>Următor pas neconsemnat<br />în sursele disponibile.</span></div>
    </div>
    <div className={s.revenueDecision} data-enter="4">
      <div className={s.decisionBrand}><Image src="/marketing/revenew-r.png" width={32} height={32} alt="ReveNew" /><span>Prioritatea devine vizibilă</span><b>01</b></div>
      <h3>O revenire de verificat.<br />Un responsabil clar.</h3>
      <p>Termenul promis a trecut. Verifică dacă discuția a continuat înainte de a pregăti revenirea.</p>
      <dl><div><dt>Responsabil</dt><dd><PersonAvatar />Ana Popescu</dd></div><div><dt>De ce acum</dt><dd>Termenul promis · 04 septembrie</dd></div></dl>
      <div className={s.nextDecision} data-enter="5"><span>URMĂTORUL PAS</span><strong>Confirmă continuarea și pregătește revenirea.</strong><small>Propunere editabilă · revizuire necesară</small></div>
      <div className={s.decisionSources} data-enter="6"><Image src="/brands/google/gmail.svg" width={18} height={18} alt="Gmail" /><ExcelMark /><span>Conversația și promisiunea, în același caz.</span></div>
    </div>
  </ChapterMotion>;
}

const activeSources = [
  {name:"Gmail", detail:"Conversații", src:"/brands/google/gmail.svg"},
  {name:"Calendar", detail:"Întâlniri", src:"/brands/google/calendar.svg"},
  {name:"Drive", detail:"Fișiere selectate", src:"/brands/applications/google-drive.svg"},
  {name:"CSV", detail:"Fișiere locale", src:null},
  {name:"XLSX", detail:"Registre locale", src:"/marketing/excel-source.png"}
] as const;
const evaluationGroups = [
  {label:"Spațiul de lucru", providers:[{name:"Microsoft 365", detail:"Outlook · Teams", src:"/brands/applications/microsoft-365.svg"}]},
  {label:"Relații comerciale", providers:[{name:"Salesforce", src:"/brands/applications/salesforce.svg"},{name:"HubSpot", src:"/brands/applications/hubspot.svg"},{name:"Pipedrive", src:"/brands/applications/pipedrive.svg", wordmark:true}]},
  {label:"Conversații", providers:[{name:"Slack", src:"/brands/applications/slack.svg"},{name:"Zoom", src:"/marketing/providers/zoom.svg", wordmark:true}]},
  {label:"Documente", providers:[{name:"Notion", src:"/marketing/providers/notion.svg"},{name:"Dropbox", src:"/marketing/providers/dropbox.svg"}]}
] as const;
const sourcePaths = [
  "M100 0V36Q100 52 116 52H484Q500 52 500 68V132",
  "M300 0V28Q300 44 316 44H484Q500 44 500 60V132",
  "M500 0V132",
  "M700 0V28Q700 44 684 44H516Q500 44 500 60V132",
  "M900 0V36Q900 52 884 52H516Q500 52 500 68V132"
];
export function ConnectedEcosystem() {
  return <ChapterMotion name="ecosystem" className={s.ecosystem} duration={6000}>
    <div className={s.supportedLabel}><span className={s.statusDot} /><strong>Surse suportate</strong><span>După configurare și autorizare</span></div>
    <div className={s.activeEcosystem}>
      <div className={s.sourceRail}>{activeSources.map((source,i)=><div key={source.name} className={s.sourceObject} data-enter={i+1}>{source.name==="XLSX"?<ExcelMark />:source.src?<Image src={source.src} width={40} height={40} alt="" />:<span className={s.csvMark}><DocumentTextIcon aria-hidden="true" /><b>CSV</b></span>}<strong>{source.name}</strong><small>{source.detail}</small><i className={s.sourcePort} /></div>)}</div>
      <svg className={s.ecosystemLines} viewBox="0 0 1000 132" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1">{sourcePaths.map(path=><path key={path} d={path} />)}</g>{sourcePaths.map((path,i)=><path key={path} className={s.sourceSignal} d={path} fill="none" stroke="#a8894b" strokeWidth="1.5" pathLength="100" data-enter={i+1} />)}</svg>
      <svg className={s.mobileSourceLines} viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0V16Q50 24 58 24H142Q150 24 150 32V60M150 0V60M250 0V16Q250 24 242 24H158Q150 24 150 32" fill="none" stroke="currentColor" /><path className={s.sourceSignal} d="M150 0V60" fill="none" stroke="#ae873a" pathLength="100" data-enter="3" /></svg>
      <div className={s.contextCore} data-enter="6"><Image src="/marketing/revenew-r.png" width={44} height={44} alt="" /><div><strong>ReveNew</strong><p>Atelier Nord · revenire de verificat.</p></div><span><ShieldCheckIcon aria-hidden="true" />Surse permise</span></div>
      <div className={s.sourceFragments} data-enter="3"><div><Image src="/brands/google/gmail.svg" width={20} height={20} alt="Gmail"/><span>„Ne puteți confirma următorul pas?”</span></div><div><ExcelMark/><span>Revenire promisă · 04 septembrie</span></div></div><div className={s.ecosystemOutput} data-enter="6"><span>Situație<strong>Continuare de verificat</strong></span><span>Responsabil<strong>Ana Popescu</strong></span><span>Următor pas<strong>Confirmă discuția și pregătește revenirea.</strong></span></div>
    </div>
    <div className={s.evaluationField}><div className={s.evaluationHeading}><div><span className={s.miniLabel}>Evaluare la cerere</span><h3>Ai un alt sistem? Pornim de la el.</h3></div><a href="/solicita-demo">Discută cu noi</a></div><div className={s.providerGroups}>{evaluationGroups.map(group=><div key={group.label} className={s.providerGroup}><h4>{group.label}</h4><div className={s.providerField}>{group.providers.map(provider=><div key={provider.name} data-wordmark={"wordmark" in provider}><Image src={provider.src} width={48} height={32} alt={"wordmark" in provider?provider.name:""} /><span>{!("wordmark" in provider)&&<strong>{provider.name}</strong>}{"detail" in provider&&<small>{provider.detail}</small>}</span></div>)}</div></div>)}</div><div className={s.billingEvaluation}><span>Facturare</span><strong>SmartBill</strong><small>Evaluare la cerere · conector neimplementat</small></div><p>Analizăm integrarea cerută de echipa ta și propunem o implementare după verificarea accesului, datelor și fezabilității. Conectorii din această bandă nu sunt implementați.</p></div>
  </ChapterMotion>;
}

const money = (value: number) => new Intl.NumberFormat("ro-RO").format(value);
export function MeasurementScene() {
 return <ChapterMotion name="measurement" className={s.resultScene} duration={7600}>
  <div className={s.resultHeader}><div><span className={s.miniLabel}>UN ALT CAZ · EXEMPLU DE REZULTAT</span><h3>{result.company}</h3><p>{result.opportunity}</p></div><span className={s.recordedStatus}>Câștigat · înregistrat de responsabil</span></div>
  <div className={s.resultNumbers}><div data-enter="1"><span>Ofertă · valoare estimată</span><strong>{money(result.estimated)} <small>{result.currency}</small></strong><p>Reperul de la care a pornit discuția.</p></div><span className={s.resultRule} aria-hidden="true"/><div data-enter="3"><span>Rezultat comercial înregistrat</span><strong>{money(result.recorded)} <small>{result.currency}</small></strong><p>{result.basis}. Nu o încasare verificată.</p></div></div>
  <div className={s.resultReceipt} data-enter="4"><div><PersonAvatar variant={1}/><span><strong>{result.actor}</strong><small>Autorul înregistrării</small></span></div><div><span>{new Intl.DateTimeFormat("ro-RO", {day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Bucharest"}).format(new Date(result.recordedAt))}</span><small>Dată și autor păstrate în audit</small></div><div><strong>{result.reason}</strong><small>{result.evidence} · versiunea {result.version}</small></div></div>
  <div className={s.resultRoadmap} data-enter="5"><span>ÎN DEZVOLTARE</span><p>Legătura cu facturarea și încasarea.</p><small>Confirmarea comercială de azi este înregistrată de o persoană. Reconcilierea facturilor și plăților nu este disponibilă.</small></div>
 </ChapterMotion>;
}

export function TrustArchitecture() {
  return <ChapterMotion name="trust" className={s.trustArchitecture} duration={6800}>
    <div className={s.trustBoundaries}><span className={s.trustSignalTrack} aria-hidden="true"><i className={s.trustSignal} /></span><div className={s.inputLane} data-enter="1"><span className={s.miniLabel}>01 · Surse</span><div className={s.trustSources}><Image src="/brands/google/gmail.svg" width={24} height={24} alt="Gmail" /><Image src="/brands/applications/google-drive.svg" width={24} height={24} alt="Drive" /><ExcelMark /></div><p>Datele echipei</p><span className={s.laneCaption}>Contextul începe la sursă.</span></div>
      <div className={s.authorizedZone}><div className={s.boundaryLabel}><LockClosedIcon aria-hidden="true" />Limita spațiului de lucru<span>Izolare între companii</span></div><AccessRole /><div className={s.intelligenceLane}><div data-enter="3"><DocumentTextIcon aria-hidden="true" /><h3>Pipeline.xlsx</h3><p>Oferte · A8:F8 · versiunea 3</p></div><ArrowRightIcon aria-hidden="true" /><div data-enter="4"><SparklesIcon aria-hidden="true" /><h3>Revenire de verificat</h3><p>Recomandare pentru Atelier Nord</p></div></div><div className={s.preparedLane} data-enter="5"><span className={s.statusDot} /><strong>Lucru pregătit</strong><span>Editabil · neexecutat</span></div></div>
      <div className={s.authorityLane} data-enter="6"><div className={s.humanGate}><ShieldCheckIcon aria-hidden="true" /><span className={s.miniLabel}>Autoritatea finală</span><h3>Decizia<br />umană.</h3><p>Fluxul automat se oprește.</p><div><PersonAvatar /><span>Ana Popescu</span><LockClosedIcon aria-hidden="true" /></div></div><div className={s.auditReceipt}><DocumentTextIcon aria-hidden="true" /><span><strong>Revizuire deschisă</strong><small>Ana Popescu · 06 sept., 14:35<br/>Pipeline.xlsx · v3 · A8:F8</small></span></div></div>
    </div><div className={s.trustAnnotations}><p><CheckIcon aria-hidden="true" />Context autorizat</p><p><CheckIcon aria-hidden="true" />Control uman</p><p><CheckIcon aria-hidden="true" />Adevăr financiar</p><span>Fiecare etapă păstrează o responsabilitate.</span></div>
  </ChapterMotion>;
}
