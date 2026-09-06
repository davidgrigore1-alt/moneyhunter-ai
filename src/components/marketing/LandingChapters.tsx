import Link from "next/link";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { LiquidLink } from "./LiquidLink";
import { DemoRequestLink } from "./DemoRequestLink";
import { MarketingBrand } from "./MarketingBrand";
import { WorkbookEvidence } from "./WorkbookEvidence";
import { WorkflowDemo } from "./WorkflowDemo";
import { CommercialThread, ConnectedEcosystem, MeasurementScene, TrustArchitecture } from "./LandingVisuals";
import s from "./chapters.module.css";

const faqs = [
  ["Este ReveNew un CRM?", "ReveNew include companii, contacte și oportunități, dar pune accentul pe firul execuției: ce necesită atenție, cine răspunde și care este următorul pas. Relația cu CRM-ul pe care îl folosești se stabilește în funcție de proces și de sursele disponibile."],
  ["Pot porni de la fișierele pe care le avem deja?", "Da. Poți inspecta și păstra fișiere locale CSV și XLSX, împreună cu versiuni și extrase de dovezi. Importul în evidențele comerciale este un pas separat, pe care îl revizuiești. Fișierele XLSX locale nu implică sincronizare Microsoft 365."],
  ["Ce este disponibil din Google Workspace?", "Gmail și Calendar pot furniza context după configurare, autorizare și sincronizare. Drive folosește documentele selectate explicit. Calendarul este disponibil pentru citire. Acoperirea surselor se verifică în fiecare configurație: istoricul Gmail poate fi incomplet, iar documentele au limite de extragere."],
  ["Poate AI-ul să trimită mesaje fără mine?", "Nu. Analiza și pregătirea nu trimit mesaje. Trimiterea Gmail, unde este configurată, cere permisiune separată, o versiune aprobată și confirmarea finală a unei persoane autorizate. Nu există trimitere autonomă."],
  ["Cum începe implementarea?", "Pornim de la un proces concret: oferte de urmărit, o predare între colegi sau o aprobare care întârzie. Verificăm sursele, accesul și responsabilitățile, apoi stabilim ce poate fi validat într-un cadru controlat."],
  ["Valoarea estimată înseamnă venit recuperat?", "Nu. Valoarea estimată ajută la prioritizare. Rezultatul comercial poate fi consemnat de o persoană autorizată. Această înregistrare nu reprezintă verificarea unei încasări bancare. O oportunitate, un draft sau o aprobare nu sunt dovada unui venit."],
  ["Aveți integrare cu SmartBill?", "Nu există în prezent un conector SmartBill implementat în ReveNew. SmartBill rămâne instrumentul pentru facturare și procese fiscale. O eventuală conectare trebuie evaluată și validată separat."]
] as const;

export function LandingChapters() {
  return <div className={s.chapters}>
    <section id="produs" className={`${s.chapter} ${s.light}`} aria-labelledby="commercial-break-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>01 / Unde se pierde continuitatea</p><h2 id="commercial-break-title">Oferta a plecat.<br />Următorul pas nu trebuie să dispară.</h2></div><p className={s.lead}>Un termen promis. O conversație rămasă deschisă. ReveNew aduce la vedere ce trebuie verificat, cine răspunde și ce urmează.</p></div>
      <CommercialThread />
    </div></section>
    <section id="masurare" className={`${s.chapter} ${s.dark}`} aria-labelledby="measurement-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>02 / De la oportunitate la rezultat</p><h2 id="measurement-title">Leagă munca comercială<br />de rezultatul care se poate verifica.</h2></div><p className={s.lead}>Vezi valoarea de pornire, rezultatul consemnat și cine l-a înregistrat. Fără să confunzi o oportunitate cu o încasare.</p></div><MeasurementScene />
    </div></section>
    <section id="executie" className={`${s.chapter} ${s.deep}`} aria-labelledby="execution-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>03 / De la context la continuare</p><h2 id="execution-title">Procesul avansează.<br />Decizia rămâne la tine.</h2></div><p className={s.lead}>Dovada devine o propunere de lucru. Un pas pregătit pentru revizuire, cu o persoană la capătul procesului.</p></div><WorkflowDemo />
    </div></section>
    <section id="integrari" className={`${s.chapter} ${s.light}`} aria-labelledby="integrations-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>04 / Instrumentele echipei tale</p><h2 id="integrations-title">Contextul începe<br />de unde lucrezi.</h2></div><p className={s.lead}>Lucrezi deja în mai multe sisteme. ReveNew leagă conversațiile, întâlnirile și fișierele într-un fir comercial care poate fi urmărit.</p></div><ConnectedEcosystem /><p className={s.integrationNote}>Google Workspace: de validat la conectare. CSV și XLSX: surse locale suportate. Mărcile identifică produse, fără a implica un parteneriat.</p>
    </div></section>
    <section id="dovezi" className={`${s.chapter} ${s.neutral}`} aria-label="Dovezi inspectabile"><div className={s.container}><WorkbookEvidence /></div></section>
    <section id="securitate" className={`${s.chapter} ${s.deep}`} aria-labelledby="trust-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>06 / Arhitectura controlului</p><h2 id="trust-title">Controlul rămâne<br />în compania ta.</h2></div><p className={s.lead}>Fiecare companie are propriul spațiu. Rolul stabilește accesul, persoana autorizată decide, iar jurnalul păstrează ce s-a schimbat.</p></div><TrustArchitecture />
    </div></section>
    <section className={`${s.chapter} ${s.light}`} aria-labelledby="fit-title"><div className={`${s.container} ${s.fitLayout}`}><div><p className={s.overline}>07 / Pentru ce fel de echipe</p><h2 id="fit-title">Când vânzarea<br />are mai mulți pași.</h2><p className={s.lead}>Pentru echipe în care o ofertă trece prin mai multe mâini și cineva trebuie să țină firul.</p><div className={s.processRibbon}><span>Comercial</span><ArrowRightIcon aria-hidden="true" /><span>Tehnic</span><ArrowRightIcon aria-hidden="true" /><span>Decizie</span></div><p className={s.industries}>Servicii B2B · distribuție · logistică · echipamente<br />Construcții · mentenanță · software · consultanță</p></div><div className={s.fitList}>
      {[["Director comercial", "Ce oferte așteaptă o revenire?", "O listă de cazuri prioritizate, fiecare cu responsabil și pas de verificat."],["Management", "Unde este blocajul și cine îl poate clarifica?", "O situație comună a promisiunilor, responsabilităților și deciziilor rămase deschise."],["Operațiuni", "Ce s-a întâmplat între promisiune și rezultat?", "Firul cazului, de la document și conversație la rezultatul consemnat."]].map(([role,title,copy])=><article key={role}><div><span className={s.miniLabel}>{role}</span><h3>{title}</h3><p>{copy}</p></div></article>)}
    </div></div></section>
    <section className={`${s.chapter} ${s.neutral}`} aria-labelledby="start-title"><div className={s.container}><div className={s.heading}><div><p className={s.overline}>Un început concret</p><h2 id="start-title">Pornim de la proces.<br/>Nu de la o promisiune.</h2></div><p className={s.lead}>Stabilim împreună ce merită urmărit și pe ce date se poate lucra.</p></div><ol className={s.startPath}><li><span>01</span><h3>Alegem un proces</h3><p>Oferte de urmărit, predări între colegi sau aprobări.</p></li><li><span>02</span><h3>Confirmăm accesul</h3><p>Sursele disponibile, persoanele și limitele de lucru.</p></li><li><span>03</span><h3>Evaluăm cazurile</h3><p>Verificăm pașii propuși și urmărim rezultatul consemnat.</p></li></ol></div></section>
    <section id="intrebari" className={`${s.chapter} ${s.faqSection}`} aria-labelledby="faq-title"><div className={`${s.container} ${s.faqLayout}`}><div><p className={s.overline}>08 / Întrebări firești</p><h2 id="faq-title">Înainte de<br />prima discuție.</h2></div><div className={s.faqList}>{faqs.map(([question,answer])=><details key={question}><summary>{question}<ChevronDownIcon aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>
    <section className={s.closing} id="urmatorul-pas" aria-labelledby="closing-title"><div className={s.container}><div className={s.closingMark} aria-hidden="true"><MarketingBrand /></div><h2 id="closing-title">Vezi ce rămâne<br />între ofertă și rezultat.</h2><p className={s.lead}>Pornim de la un proces al echipei tale. Verificăm unde se pierde continuitatea și ce merită pus în mișcare.</p><div className={s.closingActions}><DemoRequestLink material="primary" /><LiquidLink href="#cum-functioneaza" variant="quiet">Explorează produsul</LiquidLink></div></div></section>
  </div>;
}

export function MarketingFooter() {
  return <footer className={s.footer}><div className={`${s.container} ${s.footerInner}`}><div><Link prefetch={false} className={s.footerBrand} href="/" aria-label="ReveNew — pagina principală"><MarketingBrand /></Link><p>Context comercial. Dovezi. Un pas clar.</p></div><nav aria-label="Resurse și informații legale"><Link prefetch={false} href="/ghid">Ghid</Link><Link prefetch={false} href="/#integrari">Integrări</Link><Link prefetch={false} href="/privacy">Confidențialitate</Link><Link prefetch={false} href="/terms">Termeni și condiții</Link></nav><small>© {new Date().getFullYear()} ReveNew</small></div></footer>;
}
