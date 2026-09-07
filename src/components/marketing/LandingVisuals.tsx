import Image from "next/image";
import { ArrowRightIcon, CheckIcon, DocumentTextIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CompanyMark, ExcelMark, PersonAvatar } from "./MarketingEntityMark";
import { ChapterMotion } from "./ChapterMotion";
import { revenueExample as result } from "@/lib/marketing/revenue-example";
import { AccessRole } from "./AccessRole";
import s from "./chapters.module.css";
import p from "./final-polish.module.css";

export function CommercialThread() {
  return <div className={s.commercialScene}>
    <div className={s.offerContext}><span className={s.threadLabel}>ÎNAINTE · FIRUL SE PIERDE</span>
      <div className={s.caseIdentity}><CompanyMark /><div><strong>Atelier Nord</strong><p>Contract de mentenanță</p></div></div>
      <div className={s.requestLine}><Image src="/brands/google/gmail.svg" width={20} height={20} alt="Gmail"/><span>01 septembrie · „Ne puteți trimite o ofertă?”</span></div><div className={s.offerPaper} data-enter="1"><span><DocumentTextIcon aria-hidden="true" />Ofertă trimisă · 02 septembrie</span><strong>42.000 <small>RON</small></strong><p>Valoarea estimată a ofertei</p><div><PersonAvatar />Ana Popescu</div></div>
      <div className={s.promiseLine} data-enter="2"><ExcelMark /><div><small>Pipeline.xlsx · F8</small><p>„Revenim până pe 4 septembrie.”</p></div></div>
      <div className={s.commercialGap} data-enter="3"><time dateTime="2026-09-06">06 septembrie</time><span>Următor pas neconsemnat<br />în sursele disponibile.</span></div>
    </div>
    <div className={s.revenueDecision} data-enter="4">
      <div className={s.decisionBrand}><Image src="/marketing/revenew-r.png" width={32} height={32} alt="ReveNew" /><span>CU REVENew · CAZUL ARE O CONTINUARE</span><b>01</b></div>
      <h3>O revenire de verificat.<br />Un responsabil clar.</h3>
      <p>Termenul promis a trecut. Verifică dacă discuția a continuat înainte de a pregăti revenirea.</p>
      <dl><div><dt>Responsabil</dt><dd><PersonAvatar />Ana Popescu</dd></div><div><dt>De ce acum</dt><dd>Termenul promis · 04 septembrie</dd></div></dl>
      <div className={s.nextDecision} data-enter="5"><span>URMĂTORUL PAS</span><strong>Confirmă continuarea și pregătește revenirea.</strong><small>Propunere editabilă · revizuire necesară</small></div>
      <div className={s.decisionSources} data-enter="6"><Image src="/brands/google/gmail.svg" width={18} height={18} alt="Gmail" /><ExcelMark /><span>Conversația și promisiunea, în același caz.</span></div>
    </div>
  </div>;
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
  providers: EvaluationProvider[];
};

const evaluationGroups: EvaluationGroup[] = [
  {
    label: "Spațiu de lucru",
    providers: [
      { name: "Microsoft 365", src: "/brands/applications/microsoft-365.svg", detail: "Outlook · Teams" },
    ],
  },
  {
    label: "Relații comerciale",
    providers: [
      { name: "Salesforce", src: "/brands/applications/salesforce.svg" },
      { name: "HubSpot", src: "/brands/applications/hubspot.svg" },
      { name: "Pipedrive", src: "/brands/applications/pipedrive.svg", wide: true },
    ],
  },
  {
    label: "Comunicare",
    providers: [
      { name: "Slack", src: "/brands/applications/slack.svg" },
      { name: "Zoom", src: "/marketing/providers/zoom.svg", wide: true },
    ],
  },
  {
    label: "Documente și cunoștințe",
    providers: [
      { name: "Notion", src: "/marketing/providers/notion.svg" },
      { name: "Dropbox", src: "/marketing/providers/dropbox.svg" },
    ],
  },
  {
    label: "Business / România",
    providers: [
      { name: "SmartBill", src: "/marketing/providers/smartbill.png", detail: "Evaluare de integrare la cerere", wide: true },
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
  return <ChapterMotion name="ecosystem" className={s.ecosystem} duration={7600}>
    <div className={s.supportedLabel}><span className={s.statusDot} /><strong>Surse suportate</strong><span>Pornim de la contextul deja existent</span></div>
    <div className={s.activeEcosystem}>
      <div className={s.sourceRail}>
        {activeSources.map((source, i) => (
          <div key={source.name} className={s.sourceObject} data-enter={i + 1}>
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
            <rect x="-77" y="-14" width="154" height="28" rx="5" />
            <text textAnchor="middle" dominantBaseline="central">{label}</text>
          </g>
        ))}
      </svg>
      <div className={s.contextCore} data-enter="6">
        <Image src="/marketing/revenew-r.png" width={44} height={44} alt="" />
        <div>
          <strong>Atelier Nord</strong>
          <p>Revenire de verificat.</p>
        </div>
        <span><ShieldCheckIcon aria-hidden="true" />Surse permise</span>
      </div>
      <div className={s.sourceFragments} data-enter="3"><div><Image src="/brands/google/gmail.svg" width={20} height={20} alt="Gmail"/><span>„Ne puteți confirma următorul pas?”</span></div><div><ExcelMark/><span>Revenire promisă · 04 septembrie</span></div></div>
      <div className={s.ecosystemOutput} data-enter="6"><span>Situație<strong>Continuare de verificat</strong></span><span>Responsabil<strong>Ana Popescu</strong></span><span>Următor pas<strong>Confirmă discuția și pregătește revenirea.</strong></span></div>
    </div>

    <div className={p.integrationField}>
      <div className={p.integrationHeader}>
        <div>
          <span className={p.integrationKicker}>Evaluare la cerere</span>
          <h3>Ai un alt sistem? Pornim de la cel pe care echipa îl folosește deja.</h3>
          <p>Nu reconstruim procesul de la zero. Stabilim ce poate fi conectat în siguranță, în funcție de flux, acces și datele disponibile.</p>
        </div>
        <span className={p.integrationState}>Evaluare înainte de implementare</span>
      </div>

      <div className={p.integrationGrid}>
        {evaluationGroups.map(group => (
          <section className={p.integrationCluster} key={group.label} aria-label={group.label}>
            <h4>{group.label}</h4>
            <div className={p.integrationItems}>
              {group.providers.map(provider => {
                const wideStyle = provider.wide ? { width: 84, flexBasis: 84, justifyContent: "flex-start" as const } : undefined;
                const wideImageStyle = provider.wide ? { width: "auto", maxWidth: 84, height: 26, objectFit: "contain" as const } : undefined;
                return (
                  <div key={provider.name} className={p.integrationItem}>
                    <span className={p.integrationLogo} style={wideStyle}>
                      <Image src={provider.src} width={provider.wide ? 84 : 30} height={30} alt={provider.name} style={wideImageStyle} />
                    </span>
                    <span className={p.integrationItemText}>
                      <strong>{provider.name}</strong>
                      {provider.detail ? <small>{provider.detail}</small> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className={p.integrationFooter}>
        <p>Sistemele de mai sus nu sunt prezentate ca integrări active. Le evaluăm numai dacă procesul și accesul companiei justifică legătura.</p>
        <span>Sursele curente rămân Gmail · Calendar · Drive · CSV · XLSX</span>
      </div>
    </div>
  </ChapterMotion>;
}

const money = (value: number) => new Intl.NumberFormat("ro-RO").format(value);
export function MeasurementScene() {
  return <div className={s.resultScene}>
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
    <div className={s.resultRoadmap} data-enter="5"><span>ÎN DEZVOLTARE</span><p>Legătura cu facturarea și încasarea.</p><small>Confirmarea comercială de azi este înregistrată de o persoană. Reconcilierea facturilor și plăților nu este disponibilă.</small></div>
  </div>;
}

export function TrustArchitecture() {
  return <ChapterMotion name="trust" className={s.trustArchitecture} duration={6800}>
    <div className={s.trustBoundaries}>
      <div className={s.inputLane}>
        <AccessRole />
      </div>
      <div className={s.authorizedZone}>
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
        <div className={s.preparedLane} data-enter="5"><span className={s.statusDot} /><strong>Revenire comercială pregătită</strong><span>Editabil · neexecutat</span></div>
      </div>
      <div className={s.authorityLane} data-enter="6">
        <div className={s.humanGate}>
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
      <p><CheckIcon aria-hidden="true" />Adevăr financiar</p>
      <span>Fiecare etapă păstrează o responsabilitate.</span>
    </div>
  </ChapterMotion>;
}
