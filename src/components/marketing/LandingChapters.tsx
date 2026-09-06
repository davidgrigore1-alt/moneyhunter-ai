import Link from "next/link";
import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
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
  ["Valoarea estimată înseamnă venit recuperat?", "Nu. Valoarea estimată ajută la prioritizare. Venitul se confirmă prin rezultatul comercial, nu printr-o recomandare. O oportunitate, un draft sau o aprobare nu sunt dovada unui venit."],
  ["Aveți integrare cu SmartBill?", "Nu există în prezent un conector SmartBill implementat în ReveNew. SmartBill rămâne instrumentul pentru facturare și procese fiscale. O eventuală conectare trebuie evaluată și validată separat."]
] as const;

export function LandingChapters() {
  return <div className={s.chapters}>
    <section id="produs" className={`${s.chapter} ${s.light}`} aria-labelledby="commercial-break-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>01 / Unde se pierde continuitatea</p><h2 id="commercial-break-title">Oferta e trimisă.<br />Cine ține firul?</h2></div><p className={s.lead}>Cererea e în email. Oferta, într-un fișier. Promisiunea, într-o conversație. Iar următorul pas poate rămâne între ele.</p></div>
      <CommercialThread /><p className={s.chapterConclusion}>CRM-ul îți arată ce există. <strong>ReveNew îți arată unde se rupe execuția.</strong></p>
    </div></section>
    <section id="dovezi" className={`${s.chapter} ${s.neutral}`} aria-label="Dovezi inspectabile"><div className={s.container}><WorkbookEvidence /></div></section>
    <section id="executie" className={`${s.chapter} ${s.deep}`} aria-labelledby="execution-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>03 / De la context la continuare</p><h2 id="execution-title">Procesul avansează.<br />Decizia rămâne la tine.</h2></div><p className={s.lead}>Dovada devine o propunere de lucru. Un pas pregătit pentru revizuire, cu o persoană la capătul procesului.</p></div><WorkflowDemo />
    </div></section>
    <section id="integrari" className={`${s.chapter} ${s.light}`} aria-labelledby="integrations-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>04 / Instrumentele echipei tale</p><h2 id="integrations-title">Contextul începe<br />de unde lucrezi.</h2></div><p className={s.lead}>Lucrezi deja în mai multe sisteme. ReveNew leagă conversațiile, întâlnirile și fișierele într-un fir comercial care poate fi urmărit.</p></div><ConnectedEcosystem /><p className={s.integrationNote}>Google Workspace: de validat la conectare. CSV și XLSX: surse locale suportate. Mărcile identifică produse, fără a implica un parteneriat.</p>
    </div></section>
    <section id="masurare" className={`${s.chapter} ${s.dark}`} aria-labelledby="measurement-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>05 / Adevăr financiar</p><h2 id="measurement-title">Știi ce merită atenție.<br />Și ce nu e încă dovedit.</h2></div><p className={s.lead}>Valoarea unei oportunități nu este rezultatul ei. ReveNew păstrează estimarea, starea intervenției și confirmarea comercială distincte.</p></div><MeasurementScene />
    </div></section>
    <section id="securitate" className={`${s.chapter} ${s.deep}`} aria-labelledby="trust-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>06 / Arhitectura controlului</p><h2 id="trust-title">Contextul are limite.<br />Decizia are un autor.</h2></div><p className={s.lead}>Fiecare companie are propriul spațiu. Rolul stabilește accesul, persoana autorizată decide, iar jurnalul păstrează ce s-a schimbat.</p></div><TrustArchitecture />
    </div></section>
    <section className={`${s.chapter} ${s.light}`} aria-labelledby="fit-title"><div className={`${s.container} ${s.fitLayout}`}><div><p className={s.overline}>07 / Pentru ce fel de echipe</p><h2 id="fit-title">Când vânzarea<br />are mai mulți pași.</h2><p className={s.lead}>Pentru echipe în care o ofertă trece prin mai multe mâini și cineva trebuie să țină firul.</p><div className={s.processRibbon}><span>Comercial</span><ArrowRightIcon aria-hidden="true" /><span>Tehnic</span><ArrowRightIcon aria-hidden="true" /><span>Decizie</span></div><p className={s.industries}>Servicii B2B · distribuție · logistică · echipamente<br />Construcții · mentenanță · software · consultanță</p></div><div className={s.fitList}>
      {[["Oferte care cer revenire","Oferta deschide o conversație. Termenul promis și următorul pas trebuie să rămână vizibile."],["Responsabilități împărțite","Când cazul trece la alt coleg, promisiunile și responsabilitatea trebuie să treacă odată cu el."],["Relații comerciale care continuă","Reînnoiri, contracte și servicii recurente. Ce s-a promis contează și după prima ofertă."],["Documente, conversații și oameni","Un proces în care fișierul, emailul și persoana responsabilă trebuie să rămână legate."]].map(([title,copy])=><article key={title}><div><h3>{title}</h3><p>{copy}</p></div></article>)}
    </div></div></section>
    <section id="intrebari" className={`${s.chapter} ${s.faqSection}`} aria-labelledby="faq-title"><div className={`${s.container} ${s.faqLayout}`}><div><p className={s.overline}>08 / Întrebări firești</p><h2 id="faq-title">Înainte de<br />prima discuție.</h2></div><div className={s.faqList}>{faqs.map(([question,answer])=><details key={question}><summary>{question}<ChevronDownIcon aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>
    <section className={s.closing} id="urmatorul-pas" aria-labelledby="closing-title"><div className={s.container}><div className={s.closingMark} aria-hidden="true"><MarketingBrand /></div><h2 id="closing-title">Mai puțin context pierdut.<br />Mai multă claritate.</h2><p className={s.lead}>Să pornim de la un proces comercial real al echipei tale.</p><DemoRequestLink material="primary" /><Link prefetch={false} className={s.returnLink} href="#cum-functioneaza">Revino la demonstrație<ArrowRightIcon aria-hidden="true" /></Link></div></section>
  </div>;
}

export function MarketingFooter() {
  return <footer className={s.footer}><div className={`${s.container} ${s.footerInner}`}><div><Link prefetch={false} className={s.footerBrand} href="/" aria-label="ReveNew — pagina principală"><MarketingBrand /></Link><p>Context comercial. Dovezi. Un pas clar.</p></div><nav aria-label="Resurse și informații legale"><Link prefetch={false} href="/ghid">Ghid</Link><Link prefetch={false} href="/#integrari">Integrări</Link><Link prefetch={false} href="/privacy">Confidențialitate</Link><Link prefetch={false} href="/terms">Termeni și condiții</Link></nav><small>© {new Date().getFullYear()} ReveNew</small></div></footer>;
}
