import Image from "next/image";
import { ArrowRightIcon, CheckIcon, DocumentTextIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, ExcelMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import { revenueExample as result } from "@/lib/marketing/revenue-example";
import { AccessRole } from "./AccessRole";
import s from "./chapters.module.css";
import p from "./final-polish.module.css";
import r from "./reference.module.css";
import { CausalConnections } from "./CausalConnections";
import { MarketingBrandTile } from "./MarketingBrandTile";

const commercialLinks = [["break", "decision", 5]] as const;
const trustLinks = [["actor", "context", 3], ["context", "human", 5]] as const;

export function CommercialThread() {
  return <ChapterMotion name="commercial" className={r.thread} duration={1800}>
    <CausalConnections links={commercialLinks}/>
    <div className={r.timeline}>
      <div className={r.company} data-enter="1"><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div></div>
      <div className={r.request} data-enter="1"><Image src="/brands/google/gmail.svg" width={32} height={32} alt="Gmail"/><div><time dateTime="2026-09-01">01 septembrie</time><p>„Ne puteți trimite o ofertă?”</p></div></div>
      <div className={r.offer} data-enter="1"><span><DocumentTextIcon aria-hidden="true" />Ofertă trimisă · 02 septembrie <small>v3</small></span><strong>42.000 <small>RON</small></strong><p>Valoarea estimată a ofertei</p><div><PersonAvatar /><span>Ana Popescu<small>Autorul ofertei</small></span></div></div>
      <div className={r.promise} data-enter="2"><ExcelMark /><div><small>Pipeline.xlsx · F8</small><p>„Revenim până pe 4 septembrie.”</p></div></div>
      <div className={r.gap} data-enter="4" data-anchor="break"><time dateTime="2026-09-06">06 septembrie</time><p>Următor pas neconsemnat<small>În sursele disponibile.</small></p></div>
    </div>
    <div className={r.decision} data-anchor="decision">
      <div className={r.decisionBrand}><MarketingBrandTile size={36} /><strong>ReveNew</strong><span>Cazul are o continuare</span></div>
      <h3>O revenire de verificat.<br />Un responsabil clar.</h3>
      <p>Termenul promis a trecut. Verifică dacă discuția a continuat înainte de a pregăti revenirea.</p>
      <dl><div><dt>Responsabil</dt><dd><PersonAvatar />Ana Popescu</dd></div><div><dt>De ce acum</dt><dd>Termenul promis · 04 septembrie</dd></div></dl>
      <div className={r.nextStep} data-entry-port data-enter="6"><span>URMĂTORUL PAS</span><strong>Confirmă continuarea și pregătește revenirea.</strong></div>
      <div className={r.decisionSources}><Image src="/brands/google/gmail.svg" width={22} height={22} alt="Gmail" /><ExcelMark /><span>Surse: Gmail · Pipeline.xlsx</span></div>
    </div>
  </ChapterMotion>;
}

const activeSources = [
  { name: "Gmail", detail: "Cererea clientului", src: "/brands/google/gmail.svg" },
  { name: "Calendar", detail: "Întâlnirea stabilită", src: "/brands/google/calendar.svg" },
  { name: "Drive", detail: "Document selectat", src: "/brands/applications/google-drive.svg" },
  { name: "CSV", detail: "Registru comercial", src: null },
  { name: "XLSX", detail: "Oferta și promisiunea", src: "/marketing/excel-source.png" }
] as const;

type EvaluationProvider = {
  name: string;
  src: string;
  detail?: string;
  wide?: boolean;
};

type EvaluationGroup = {
  label: string;
  purpose: string;
  providers: EvaluationProvider[];
};

const evaluationGroups: EvaluationGroup[] = [
  {
    label: "Spațiu de lucru",
    purpose: "Email, calendare și documente de lucru",
    providers: [
      { name: "Microsoft 365", src: "/brands/applications/microsoft-365.svg", detail: "Spațiul de lucru al echipei" },
      { name: "Outlook", src: "/marketing/providers/microsoft-outlook.svg" },
      { name: "Teams", src: "/marketing/providers/microsoft-teams.svg" },
      { name: "OneDrive", src: "/marketing/providers/microsoft-onedrive.svg" },
      { name: "SharePoint", src: "/marketing/providers/microsoft-sharepoint.svg" },
    ],
  },
  {
    label: "Relații comerciale / CRM",
    purpose: "Clienți, oferte și stadiul discuțiilor",
    providers: [
      { name: "Salesforce", src: "/brands/applications/salesforce.svg" },
      { name: "HubSpot", src: "/brands/applications/hubspot.svg" },
      { name: "Pipedrive", src: "/brands/applications/pipedrive.svg", wide: true },
      { name: "Microsoft Dynamics 365", src: "/marketing/providers/dynamics-current.svg" },
      { name: "Zoho CRM", src: "/marketing/providers/zoho-dark.svg", wide: true },
    ],
  },
  {
    label: "Comunicare",
    purpose: "Conversații și întâlniri ale echipei",
    providers: [
      { name: "Slack", src: "/brands/applications/slack.svg" },
      { name: "Zoom", src: "/marketing/providers/zoom.svg", wide: true },
      { name: "Google Meet", src: "/marketing/providers/google-meet.svg" },
    ],
  },
  {
    label: "Documente și cunoștințe",
    purpose: "Fișiere și informația păstrată în companie",
    providers: [
      { name: "Notion", src: "/marketing/providers/notion.svg" },
      { name: "Dropbox", src: "/marketing/providers/dropbox.svg" },
      { name: "Confluence", src: "/marketing/providers/confluence.svg" },
    ],
  },
];

const sourcePaths = [
  "M100 0V36Q100 52 116 52H484Q500 52 500 68V132",
  "M300 0V28Q300 44 316 44H484Q500 44 500 60V132",
  "M500 0V132",
  "M700 0V28Q700 44 684 44H516Q500 44 500 60V132",
  "M900 0V36Q900 52 884 52H516Q500 52 500 68V132"
];

export function ConnectedEcosystem() {
  return <ChapterMotion name="ecosystem" className={`${s.ecosystem} ${r.ecosystem}`} duration={9500}>
    <div className={s.supportedLabel}><span className={s.statusDot} /><strong>Surse suportate</strong><span>Pornim de la contextul deja existent</span></div>
    <div className={s.activeEcosystem}>
      <div className={s.sourceRail}>
        {activeSources.map((source, i) => (
          <div key={source.name} className={s.sourceObject} data-source-object={i}>
            {source.name === "XLSX" ? <ExcelMark /> : source.src ? <Image src={source.src} width={40} height={40} alt="" /> : <span className={s.csvMark}><DocumentTextIcon aria-hidden="true" /><b>CSV</b></span>}
            <strong>{source.name}</strong>
            <small>{source.detail}</small>
            <i className={s.sourcePort} />
          </div>
        ))}
      </div>
      <svg className={s.ecosystemLines} viewBox="0 0 1000 132" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1">{sourcePaths.map((path, i) => <path key={path} d={path} data-source-route={i} />)}</g>
        {[
          "Cerere client",
          "Întâlnire · 03 sept.",
          "Document selectat",
          "Caz · Atelier Nord",
          "Promisiune · 04 sept.",
        ].map((label, i) => (
          <g key={label} data-source-packet={i} opacity="0" className={s.informationPacket}>
            <g transform="scale(1.1)"><rect x="-77" y="-14" width="154" height="28" rx="5" />
            <text textAnchor="middle" dominantBaseline="central">{label}</text></g>
          </g>
        ))}
      </svg>
      <div className={s.contextCore} data-context-core>
        <MarketingBrandTile size={52} />
        <div>
          <strong>Atelier Nord</strong>
          <p>Revenire de verificat.</p>
        </div>
        <span><ShieldCheckIcon aria-hidden="true" />Surse permise</span>
      </div>
      <div className={s.sourceFragments}><div><Image src="/brands/google/gmail.svg" width={20} height={20} alt="Gmail"/><span>„Ne puteți trimite o ofertă?”</span></div><div><ExcelMark/><span>Revenire promisă · 04 septembrie</span></div></div>
      <div className={s.ecosystemOutput}><span>Situație<strong>Continuare de verificat</strong></span><span>Responsabil<strong>Ana Popescu</strong></span><span>Următor pas<strong>Confirmă discuția și pregătește revenirea.</strong></span></div>
    </div>

  </ChapterMotion>;
}

export function EvaluatedEcosystem() {
  return <ChapterMotion name="evaluation" className={r.evaluation} duration={450}>
      <div className={r.evaluationHeading}>
        <div>
          <span className={p.integrationKicker}>Evaluare la cerere</span>
          <h3>Ai un alt sistem? Pornim de la cel pe care echipa îl folosește deja.</h3>
          <p>Evaluăm conectarea în funcție de proces, acces și datele disponibile.</p>
        </div>
        <span className={p.integrationState}>Evaluare înainte de implementare</span>
      </div>

      <div className={r.evaluationGrid} data-enter="1">
        <div className={r.evaluationCore}><small>Înainte de conectare</small><MarketingBrandTile size={94}/><strong>ReveNew</strong><span>Evaluăm ce are sens<br/>pentru procesul tău.</span><ol className={r.evaluationCriteria}><li>Proces</li><li>Acces</li><li>Date</li></ol></div>
        {evaluationGroups.map((group,i) => (
          <section className={r.providerGroup} key={group.label} aria-label={group.label}>
            <header className={r.providerHeading}><h4><span>0{i+1}</span>{group.label}</h4><p>{group.purpose}</p></header>
            <div className={r.providerList}>
              {group.providers.map((provider,j) => <div key={provider.name} className={r.provider} data-primary={i===0&&j===0}>
                <span className={r.providerLogo} data-wide={provider.wide} data-provider={provider.name}>
                  <Image src={provider.src} width={provider.wide ? 62 : 28} height={28} alt="" />
                </span>
                <span><strong>{provider.name}</strong>{provider.detail?<small>{provider.detail}</small>:null}</span>
              </div>)}
            </div>
          </section>
        ))}
      </div>
      <div className={r.localIntegration}><span>Business / România</span><Image src="/marketing/providers/smartbill.png" width={124} height={38} alt="SmartBill"/><strong>Evaluare la cerere</strong><p>Conectarea se stabilește pentru procesul tău.</p></div>
      <p className={r.evaluationTruth}>Sistemele de mai sus sunt evaluate înainte de implementare. Nu sunt integrări active.</p>
      <div className={r.supportedStrip}><strong>Surse disponibile acum</strong><div>{activeSources.map(source=><span key={source.name}>{source.name==="XLSX"?<ExcelMark/>:source.src?<Image src={source.src} width={21} height={21} alt=""/>:<DocumentTextIcon aria-hidden="true"/>}{source.name}</span>)}</div><small>Cu accesul și configurarea necesare</small></div>
  </ChapterMotion>;
}

const money = (value: number) => new Intl.NumberFormat("ro-RO").format(value);
export function MeasurementScene() {
  return <ChapterMotion name="measurement" duration={900} className={`${s.resultScene} ${r.result}`}>
    <div className={s.resultHeader}>
      <div>
        <span className={s.miniLabel}>UN ALT CAZ · EXEMPLU DE REZULTAT</span>
        <h3>{result.company}</h3>
        <p>{result.opportunity}</p>
      </div>
      <span className={s.recordedStatus}>Câștigat · înregistrat de responsabil</span>
    </div>
    <div className={s.resultLevels}><span>01 · Oportunitate estimată</span><span>02 · Rezultat consemnat</span><span>03 · Încasare: nivel distinct</span></div>
    <div className={s.resultNumbers}><div data-enter="1"><span>Ofertă · valoare estimată</span><strong>{money(result.estimated)} <small>{result.currency}</small></strong><p>Reperul de la care a pornit discuția.</p></div><span className={s.resultRule} aria-hidden="true"/><div data-enter="3"><span>Rezultat comercial înregistrat</span><strong>{money(result.recorded)} <small>{result.currency}</small></strong><p>{result.basis}. Nu o încasare verificată.</p></div></div>
    <div className={s.resultReceipt} data-enter="4"><div><PersonAvatar variant={1} /><span><strong>{result.actor}</strong><small>Autorul înregistrării</small></span></div><div><span>{new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }).format(new Date(result.recordedAt))}</span><small>Dată și autor păstrate în audit</small></div><div><strong>{result.reason}</strong><small>{result.evidence} · versiunea {result.version}</small></div></div>
    <div className={r.financialBoundary}><LockClosedIcon aria-hidden="true"/><div><strong>Facturarea și încasarea rămân separat.</strong><p>Reconcilierea automată a facturilor și plăților nu este disponibilă în prezent.</p></div></div>
  </ChapterMotion>;
}

export function TrustArchitecture() {
  return <ChapterMotion name="trust" className={`${s.trustArchitecture} ${r.trust}`} duration={1300}>
    <div className={s.trustBoundaries}>
      <CausalConnections links={trustLinks}/>
      <div className={s.inputLane} data-anchor="actor">
        <AccessRole />
      </div>
      <div className={s.authorizedZone} data-anchor="context">
        <div className={s.boundaryLabel}><LockClosedIcon aria-hidden="true" />Limita spațiului de lucru<span>Izolare între companii</span></div>
        <div className={s.permittedSources}>
          <span className={s.miniLabel}>SURSE PERMISE PENTRU CAZ</span>
          <div className={s.trustSources}>
            <Image src="/brands/google/gmail.svg" width={24} height={24} alt="Gmail" />
            <Image src="/brands/applications/google-drive.svg" width={24} height={24} alt="Drive" />
            <ExcelMark />
          </div>
          <p>Conversația selectată · documentul · intervalul citat</p>
        </div>
        <div className={s.intelligenceLane}>
          <div data-enter="3"><DocumentTextIcon aria-hidden="true" /><h3>Pipeline.xlsx</h3><p>Oferte · A8:F8 · versiunea 3</p></div>
          <ArrowRightIcon aria-hidden="true" />
          <div data-enter="4"><SparklesIcon aria-hidden="true" /><h3>Revenire de verificat</h3><p>Recomandare pentru Atelier Nord</p></div>
        </div>
        <div className={s.preparedLane} data-enter="4"><strong>Revenire comercială pregătită</strong><span>Editabil · neexecutat</span></div>
      </div>
      <div className={s.authorityLane}>
        <div className={s.humanGate} data-anchor="human" data-enter="6">
          <ShieldCheckIcon aria-hidden="true" />
          <span className={s.miniLabel}>Autoritatea finală</span>
          <h3>Decizia <br />umană.</h3>
          <p>Fluxul automat se oprește.</p>
          <div>
            <PersonAvatar />
            <span>Ana Popescu</span>
            <LockClosedIcon aria-hidden="true" />
          </div>
        </div>
        <div className={s.auditReceipt}><DocumentTextIcon aria-hidden="true" /><span><strong>Audit · revizuire deschisă</strong><small>Ana Popescu · 06 sept., 14:35<br/>Pipeline.xlsx · v3 · A8:F8</small></span></div>
      </div>
    </div>
    <div className={s.trustAnnotations}>
      <p><CheckIcon aria-hidden="true" />Context autorizat</p>
      <p><CheckIcon aria-hidden="true" />Control uman</p>
      <p><CheckIcon aria-hidden="true" />Auditabil</p>
      <span>Fiecare etapă păstrează o responsabilitate.</span>
    </div>
  </ChapterMotion>;
}
