import Image from "next/image";
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, DocumentTextIcon, FingerPrintIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, ExcelMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import { theatreCompanies, portfolioTotal, reviewTotal } from "@/lib/marketing/theatre-portfolio";
import s from "./chapters.module.css";

export function CommercialThread() {
  return <ChapterMotion name="commercial-thread" className={s.thread}>
    <div className={s.threadHeading}><div className={s.caseIdentity}><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div></div><p>Un caz ilustrativ <span>·</span> 6 septembrie 2026</p></div>
    <ol className={s.threadPath}>
      <li data-enter="1"><div className={s.threadDate}><span>01 sept.</span><i /></div><article className={s.mailObject}><div className={s.objectLabel}><Image src="/brands/google/gmail.svg" alt="" width={20} height={20} />Cererea</div><h3>„Ne puteți trimite<br /> o ofertă?”</h3><p>Mentenanță · 12 luni</p><span className={s.objectFoot}>Context primit<CheckIcon aria-hidden="true" /></span></article></li>
      <li data-enter="2"><div className={s.threadDate}><span>02 sept.</span><i /></div><article className={s.offerObject}><div className={s.objectLabel}><DocumentTextIcon aria-hidden="true" />Oferta</div><h3>42.000 <small>RON</small></h3><p>Valoare estimată</p><span className={s.objectFoot}><PersonAvatar />Ana Popescu</span></article></li>
      <li data-enter="3"><div className={s.threadDate}><span>04 sept.</span><i /></div><article className={s.promiseObject}><div className={s.objectLabel}><ExcelMark />Promisiunea</div><h3>„Revenim până<br /> pe 4 septembrie.”</h3><p>Pipeline.xlsx · F8</p><span className={s.objectFoot}>Termen consemnat<CheckIcon aria-hidden="true" /></span></article></li>
      <li className={s.breakStep} data-enter="4"><div className={s.threadDate}><span>06 sept.</span><i /></div><article><div className={s.objectLabel}>Fir întrerupt</div><span className={s.missingGlyph} aria-hidden="true">···</span><h3>Următorul pas<br /> lipsește.</h3><p>În contextul disponibil</p></article></li>
    </ol>
    <div className={s.reconnected} data-enter="5"><div className={s.reconnectTitle}><Image src="/marketing/revenew-r.png" width={34} height={34} alt="ReveNew" /><div><span>Firul continuă de aici</span><h3>Verifică. Clarifică. Pregătește revenirea.</h3></div></div><div className={s.reconnectFacts}><span><DocumentTextIcon aria-hidden="true" />Dovadă asociată</span><span><PersonAvatar />Ana Popescu</span><span className={s.goldText}>Pas de revizuit<ArrowUpRightIcon aria-hidden="true" /></span></div></div>
  </ChapterMotion>;
}

const activeSources = [
  {name:"Gmail", detail:"Conversații", src:"/brands/google/gmail.svg"},
  {name:"Calendar", detail:"Întâlniri", src:"/brands/google/calendar.svg"},
  {name:"Drive", detail:"Fișiere selectate", src:"/brands/applications/google-drive.svg"},
  {name:"CSV", detail:"Fișiere locale", src:null},
  {name:"XLSX", detail:"Registre locale", src:"/marketing/excel-source.png"}
] as const;
const evaluationProviders = [
  {name:"Microsoft 365", detail:"Outlook · Teams", src:"microsoft-365.svg"},
  {name:"Salesforce", detail:"CRM", src:"salesforce.svg"},
  {name:"HubSpot", detail:"CRM", src:"hubspot.svg"},
  {name:"Pipedrive", detail:"CRM", src:"pipedrive.svg"},
  {name:"Slack", detail:"Comunicare", src:"slack.svg"}
] as const;
export function ConnectedEcosystem() {
  return <ChapterMotion name="ecosystem" className={s.ecosystem} duration={6000}>
    <div className={s.supportedLabel}><span className={s.statusDot} /><strong>Surse suportate</strong><span>După configurare și autorizare</span></div>
    <div className={s.activeEcosystem}>
      <div className={s.sourceRail}>{activeSources.map((source,i)=><div key={source.name} className={s.sourceObject} data-enter={i<3?1:2}>{source.src?<Image src={source.src} width={40} height={40} alt="" />:<span className={s.csvMark}><DocumentTextIcon aria-hidden="true" /><b>CSV</b></span>}<strong>{source.name}</strong><small>{source.detail}</small><i className={s.sourcePort} /></div>)}</div>
      <svg className={s.ecosystemLines} viewBox="0 0 1000 132" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1"><path d="M100 0V36Q100 52 116 52H484Q500 52 500 68V132M300 0V28Q300 44 316 44H484Q500 44 500 60M500 0V132M700 0V28Q700 44 684 44H516Q500 44 500 60M900 0V36Q900 52 884 52H516Q500 52 500 68" /></g><path className={s.sourceSignal} d="M100 0V36Q100 52 116 52H484Q500 52 500 68V132" fill="none" stroke="#ae873a" strokeWidth="2" pathLength="100" data-enter="3" /></svg>
      <svg className={s.mobileSourceLines} viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0V16Q50 24 58 24H142Q150 24 150 32V60M150 0V60M250 0V16Q250 24 242 24H158Q150 24 150 32" fill="none" stroke="currentColor" /><path className={s.sourceSignal} d="M150 0V60" fill="none" stroke="#ae873a" pathLength="100" data-enter="3" /></svg>
      <div className={s.contextCore} data-enter="4"><Image src="/marketing/revenew-r.png" width={44} height={44} alt="" /><div><strong>ReveNew</strong><p>Contextul unei decizii.</p></div><span><ShieldCheckIcon aria-hidden="true" />Acces autorizat</span></div>
      <div className={s.coreAnnotations} data-enter="5"><span>Conversații</span><i /><span>Documente</span><i /><span>Responsabilități</span></div>
    </div>
    <div className={s.evaluationField}><div className={s.evaluationHeading}><div><span className={s.miniLabel}>Ecosistem de evaluat</span><h3>Ai un alt sistem? Pornim de la el.</h3></div><a href="/solicita-demo">Discută integrarea<ArrowUpRightIcon aria-hidden="true" /></a></div><div className={s.providerField}>{evaluationProviders.map(provider=><div key={provider.name}><Image src={`/brands/applications/${provider.src}`} width={44} height={36} alt="" /><span><strong>{provider.name}</strong><small>{provider.detail}</small></span></div>)}</div><p>Conectări neimplementate. Evaluăm fezabilitatea la cerere, înainte de orice activare.</p></div>
  </ChapterMotion>;
}

const money = (value: number) => new Intl.NumberFormat("ro-RO").format(value);
export function MeasurementScene() {
  const attention = theatreCompanies.filter(company=>company.status==="De revizuit");
  return <ChapterMotion name="measurement" className={s.measurement} duration={5600}>
    <div className={s.measurementHeading}><span><span className={s.statusDot} />Portofoliu demonstrativ</span><span>Instantaneu · 8 companii · RON</span></div>
    <div className={s.moneyLayout}><div className={s.estimatedPanel}><span className={s.miniLabel}>Valoare comercială estimată</span><div className={s.portfolioValue} data-enter="1">{money(portfolioTotal)}<span>RON</span></div><div className={s.attentionBar} aria-label="282.000 RON din 930.000 RON necesită revizuire"><span data-enter="2" /></div><p className={s.attentionAmount} data-enter="2"><strong>{money(reviewTotal)} RON</strong> în 3 cazuri de revizuit</p><div className={s.reviewLedger} data-enter="3">{attention.map(company=><div key={company.name}><CompanyMark variant={company.mark} /><span>{company.name}</span><strong>{money(company.arr)} <small>RON</small></strong></div>)}</div></div>
      <div className={s.confirmedPanel} data-enter="4"><span className={s.miniLabel}>Rezultat comercial confirmat</span><div className={s.notEqual} aria-hidden="true">≠</div><h3>Încă nedovedit.</h3><p>În acest exemplu nu există un rezultat comercial confirmat.</p><div className={s.confirmedGate}><LockClosedIcon aria-hidden="true" /><p><strong>Confirmarea are propria dovadă.</strong><span>O ofertă, un draft sau o aprobare nu confirmă un venit.</span></p></div></div></div>
    <div className={s.interventionStates} data-enter="5"><span>Starea intervențiilor</span><div><span><i />3 de revizuit</span><span><i />3 în discuție</span><span><i />2 cu pas stabilit</span></div><p>Stare curentă ilustrativă · fără istoric presupus</p></div>
  </ChapterMotion>;
}

export function TrustArchitecture() {
  return <ChapterMotion name="trust" className={s.trustArchitecture} duration={6800}>
    <div className={s.trustBoundaries}><span className={s.trustSignalTrack} aria-hidden="true"><i className={s.trustSignal} /></span><div className={s.inputLane} data-enter="1"><span className={s.miniLabel}>01 · Surse</span><div className={s.trustSources}><Image src="/brands/google/gmail.svg" width={24} height={24} alt="Gmail" /><Image src="/brands/applications/google-drive.svg" width={24} height={24} alt="Drive" /><ExcelMark /></div><p>Datele echipei</p><span className={s.laneCaption}>Contextul începe la sursă.</span></div>
      <div className={s.authorizedZone}><div className={s.boundaryLabel}><LockClosedIcon aria-hidden="true" />Limita spațiului de lucru<span>Izolare între companii</span></div><div className={s.permissionGate} data-enter="2"><FingerPrintIcon aria-hidden="true" /><div><strong>Acces autorizat</strong><span>Rol și permisiuni verificate</span></div><CheckIcon aria-hidden="true" /></div><div className={s.intelligenceLane}><div data-enter="3"><DocumentTextIcon aria-hidden="true" /><h3>Dovezi permise</h3><p>Sursă · versiune · context</p></div><ArrowRightIcon aria-hidden="true" /><div data-enter="4"><SparklesIcon aria-hidden="true" /><h3>Inteligență operațională</h3><p>Analiză susținută de dovezi</p></div></div><div className={s.preparedLane} data-enter="5"><span className={s.statusDot} /><strong>Lucru pregătit</strong><span>Editabil · neexecutat</span></div></div>
      <div className={s.authorityLane} data-enter="6"><div className={s.humanGate}><ShieldCheckIcon aria-hidden="true" /><span className={s.miniLabel}>Autoritatea finală</span><h3>Decizia<br />umană.</h3><p>Fluxul automat se oprește.</p><div><PersonAvatar /><span>Ana Popescu</span><LockClosedIcon aria-hidden="true" /></div></div><div className={s.auditReceipt}><DocumentTextIcon aria-hidden="true" /><span><strong>Auditabilitate</strong><small>Cine · pe ce bază · ce s-a schimbat</small></span></div></div>
    </div><div className={s.trustAnnotations}><p><CheckIcon aria-hidden="true" />Context autorizat</p><p><CheckIcon aria-hidden="true" />Control uman</p><p><CheckIcon aria-hidden="true" />Adevăr financiar</p><span>Fiecare etapă păstrează o responsabilitate.</span></div>
  </ChapterMotion>;
}
