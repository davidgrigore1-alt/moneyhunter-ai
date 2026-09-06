import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { LiquidLink } from "./LiquidLink";
import { DemoRequestLink } from "./DemoRequestLink";
import { MarketingBrand } from "./MarketingBrand";
import { WorkbookEvidence } from "./WorkbookEvidence";
import { QualificationRouter } from "./QualificationRouter";
import { WorkflowDemo } from "./WorkflowDemo";
import { CommercialThread, ConnectedEcosystem, MeasurementScene, TrustArchitecture } from "./LandingVisuals";
import s from "./chapters.module.css";

const faqs = [
  ["Înlocuiește ReveNew CRM-ul?", "Nu trebuie să înlocuiești CRM-ul ca să începi discuția. ReveNew urmărește continuitatea comercială: caz, dovezi, responsabil, pas următor și rezultat. Stabilim cum lucrează alături de evidențele tale, în funcție de sursele și conectările disponibile."],
  ["Cu ce date putem începe?", "Cu un proces și sursele lui: oferte, conversații, întâlniri sau registre CSV/XLSX. Alegem împreună datele necesare. Fișierele locale pot fi inspectate și păstrate cu versiuni; importul în evidențele comerciale este un pas separat, revizuit de echipă."],
  ["Ce poate vedea AI-ul?", "Doar contextul permis pentru utilizator și pentru spațiul companiei, din sursele autorizate pentru analiză. Accesul la o aplicație nu înseamnă acces la toate datele ei. Sursele lipsă sau acoperirea incompletă limitează concluzia și trebuie verificate."],
  ["Poate ReveNew trimite sau executa singur?", "Nu execută autonom acțiuni externe. Analiza produce recomandări și propuneri de lucru. Trimiterea Gmail, unde este configurată, cere permisiune separată, o versiune aprobată și confirmarea finală a unei persoane autorizate."],
  ["Ce integrări sunt disponibile?", "Gmail și Calendar pot furniza context după configurare, autorizare și sincronizare. Calendarul este pentru citire; Drive folosește documentele selectate explicit. CSV și XLSX sunt surse locale, fără sincronizare Microsoft 365. Istoricul Gmail și extragerea documentelor pot avea acoperire parțială. Celelalte sisteme afișate sunt opțiuni de evaluare la cerere, nu conectări active."],
  ["Cum începe implementarea?", "Cu un singur proces și un responsabil din echipa ta. Definim cazurile urmărite, confirmăm sursele și accesul, apoi configurăm lucrul pe datele convenite. Echipa primește cazurile care cer atenție, cu dovezi, responsabil și propunerea următorului pas; persoanele desemnate revizuiesc și urmăresc rezultatul."],
  ["Cum separați o valoare estimată de un rezultat confirmat?", "Estimarea ajută la prioritizare. Rezultatul comercial este consemnat de o persoană autorizată, cu autor, dată și motiv, astfel încât echipa să poată verifica înregistrarea. Nu reprezintă o încasare bancară verificată. Reconcilierea facturilor și plăților rămâne în dezvoltare."],
  ["Ce se întâmplă dacă folosim un sistem care nu apare pe site?", "Pornim de la procesul și datele pe care le ai deja. Evaluăm accesul, datele disponibile și fezabilitatea conectării înainte de a propune implementarea. SmartBill și celelalte sisteme din zona de evaluare nu au în prezent un conector ReveNew implementat; existența unui API nu înseamnă o integrare deja disponibilă."],
  ["Cine controlează rezultatul și acțiunile?", "Persoanele autorizate din compania ta. Responsabilul comercial verifică situația, persoana desemnată decide asupra propunerii, iar rezultatul este consemnat separat. Rolurile limitează accesul, iar jurnalul păstrează autorul și schimbările. Un draft sau o aprobare nu confirmă automat un venit."]
] as const;

export function LandingChapters() {
  return <div className={s.chapters}>
    <section id="produs" className={`${s.chapter} ${s.light}`} aria-labelledby="commercial-break-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>01 / Unde se pierde continuitatea</p><h2 id="commercial-break-title">Oferta a plecat.<br />Următorul pas nu trebuie să dispară.</h2></div><p className={s.lead}>Un termen promis. O conversație rămasă deschisă. ReveNew aduce la vedere ce trebuie verificat, cine răspunde și ce urmează.</p></div>
      <CommercialThread />
    </div></section>
    <section id="ce-se-schimba" className={`${s.chapter} ${s.neutral}`} aria-labelledby="change-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>02 / Ce se schimbă cu ReveNew</p><h2 id="change-title">Din informații răspândite,<br />un caz cu un pas clar.</h2></div><p className={s.lead}>ReveNew leagă informația comercială pe care compania o are deja și scoate la vedere unde se rupe execuția: ce caz necesită atenție, pe ce dovezi, cine răspunde, ce pas urmează și ce rezultat a fost confirmat.</p></div>
      <div className={s.valueComparison}>
        {[["Cazul", "Oferta și promisiunea rămân între fișier, email și colegi. Blocajul poate fi observat târziu.", "Cazul care cere atenție apare împreună cu dovezile și informația care lipsește."], ["Responsabilitatea", "La predarea între colegi, poate rămâne neclar cine continuă discuția.", "Responsabilul este vizibil; când lipsește, echipa știe ce trebuie clarificat."], ["Următorul pas", "O revenire promisă poate rămâne fără termen, acțiune sau revizuire.", "Echipa primește o propunere de pas următor, pe care persoana autorizată o verifică și o decide."], ["Rezultatul", "O ofertă deschisă poate fi confundată cu un rezultat obținut.", "Estimarea rămâne separată de rezultatul consemnat, cu autor și motiv de verificat."]].map(([label,before,after])=><div className={s.comparisonRow} key={label}><h3>{label}</h3><p><span>Fără un fir comun</span>{before}</p><p><span>Cu ReveNew</span>{after}</p></div>)}
      </div>
      <ol className={s.commercialChain} aria-label="De la context la rezultat">{["Context", "Ruptură", "Dovezi", "Responsabil", "Pas pregătit", "Decizie umană", "Rezultat verificabil"].map(step=><li key={step}>{step}</li>)}</ol>
    </div></section>
    <section id="masurare" className={`${s.chapter} ${s.dark}`} aria-labelledby="measurement-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>03 / De la oportunitate la rezultat</p><h2 id="measurement-title">Nu numim venit<br />ceea ce este încă oportunitate.</h2></div><p className={s.lead}>Vezi valoarea de pornire, rezultatul consemnat și cine l-a înregistrat. Fără să confunzi o oportunitate cu o încasare.</p></div><MeasurementScene />
    </div></section>
    <section id="executie" className={`${s.chapter} ${s.deep}`} aria-labelledby="execution-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>04 / De la context la continuare</p><h2 id="execution-title">Dintr-un semnal,<br />într-un pas pregătit.</h2></div><p className={s.lead}>Contextul potrivit, responsabilul potrivit și o propunere de verificat. Echipa păstrează decizia.</p></div><WorkflowDemo />
    </div></section>
    <section id="integrari" className={`${s.chapter} ${s.light}`} aria-labelledby="integrations-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>05 / Instrumentele echipei tale</p><h2 id="integrations-title">Instrumentele rămân.<br />Informația lucrează împreună.</h2></div><p className={s.lead}>Conversația, întâlnirea și documentul ajung în același caz comercial — în limitele accesului acordat.</p></div><ConnectedEcosystem /><p className={s.integrationNote}>Alegem sursele potrivite procesului tău. <a href="#intrebari">Vezi detaliile despre acces și integrări.</a></p>
    </div></section>
    <section id="dovezi" className={`${s.chapter} ${s.neutral}`} aria-label="Dovezi inspectabile"><div className={s.container}><WorkbookEvidence /></div></section>
    <section id="securitate" className={`${s.chapter} ${s.deep}`} aria-labelledby="trust-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>07 / Cine vede și cine decide</p><h2 id="trust-title">Controlul rămâne<br />în compania ta.</h2></div><p className={s.lead}>Cine vede informația, cine aprobă și pe ce dovezi se bazează decizia rămân explicite.</p></div><TrustArchitecture />
    </div></section>
    <section id="potrivire" className={`${s.chapter} ${s.light}`} aria-labelledby="fit-title"><div className={s.container}><div className={s.heading}><div><p className={s.overline}>08 / Potrivire comercială</p><h2 id="fit-title">Vezi unde s-ar aplica<br />în compania ta.</h2></div><p className={s.lead}>Oferte, predări între colegi sau reînnoiri. Pornește de la felul în care lucrezi și vezi ce ar merita urmărit.</p></div><QualificationRouter /></div></section>
    <section id="incepem" className={`${s.chapter} ${s.deep} ${s.collaborationStart}`} aria-labelledby="start-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>09 / Colaborarea</p><h2 id="start-title">Începem cu<br />un singur proces.</h2></div><p className={s.lead}>Implementăm ReveNew în jurul unui flux comercial concret. Echipa primește cazurile care cer atenție și un mod comun de a le duce mai departe.</p></div>
      <ol className={s.startPath}><li><span>01</span><h3>Alegem procesul</h3><p>Ofertare, reveniri, predare între colegi, aprobări sau reînnoiri. Stabilim ce situații urmărim și cine răspunde de proces.</p></li><li><span>02</span><h3>Confirmăm sursele și accesul</h3><p>Echipa ta aduce exemplele de cazuri și sursele convenite. Persoana cu drept de acces autorizează numai datele și sistemele necesare.</p></li><li><span>03</span><h3>Aducem cazurile în fața echipei</h3><p>ReveNew scoate la vedere situațiile care cer atenție: dovezi, responsabil, lipsuri și propunerea pasului următor, pregătită pentru revizuire.</p></li></ol>
      <div className={s.startHandoff}><span>CE PRIMEȘTE ECHIPA</span><strong>Prioritate</strong><strong>Dovadă</strong><strong>Responsabil</strong><strong>Pas pregătit</strong><strong>Revizuire</strong></div><dl className={s.engagementDetails}><div><dt>Cine participă din echipa ta</dt><dd>Responsabilul procesului comercial, persoana care autorizează sursele și colegii desemnați să revizuiască și să decidă.</dd></div><div><dt>După activare</dt><dd>Echipa verifică situațiile, clarifică lipsurile și decide pașii propuși. Urmărim cazurile și rezultatele consemnate, apoi stabilim ce ajustăm sau extindem.</dd></div></dl>
      <p className={s.engagementClose}>Prima discuție pornește de la un caz al companiei tale. <a href="/solicita-demo">Discută cu noi</a></p>
    </div></section>
    <section id="intrebari" className={`${s.chapter} ${s.faqSection}`} aria-labelledby="faq-title"><div className={`${s.container} ${s.faqLayout}`}><div><p className={s.overline}>Întrebările deciziei</p><h2 id="faq-title">Înainte să începem.</h2><p className={s.lead}>Ce vrei să știi înainte să pui procesul și datele pe masă.</p></div><div className={s.faqList}>{faqs.map(([question,answer])=><details key={question}><summary>{question}<ChevronDownIcon aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>
    <section className={s.closing} id="urmatorul-pas" aria-labelledby="closing-title"><div className={s.container}><div className={s.closingMark} aria-hidden="true"><MarketingBrand /></div><h2 id="closing-title">Vezi ce rămâne<br />între ofertă și rezultat.</h2><p className={s.lead}>Pornim de la un proces real al echipei tale și vedem unde se pierde continuitatea, cine trebuie să intervină și ce rezultat poate fi urmărit.</p><div className={s.closingActions}><DemoRequestLink material="primary" /><LiquidLink href="#cum-functioneaza" variant="quiet">Explorează produsul</LiquidLink></div></div></section>
  </div>;
}

export function MarketingFooter() {
  return <footer className={s.footer}><div className={`${s.container} ${s.footerInner}`}><div><Link prefetch={false} className={s.footerBrand} href="/" aria-label="ReveNew — pagina principală"><MarketingBrand /></Link><p>Context comercial. Dovezi. Un pas clar.</p></div><nav aria-label="Resurse și informații legale"><Link prefetch={false} href="/ghid">Ghid</Link><Link prefetch={false} href="/#integrari">Integrări</Link><Link prefetch={false} href="/privacy">Confidențialitate</Link><Link prefetch={false} href="/terms">Termeni și condiții</Link></nav><small>© {new Date().getFullYear()} ReveNew</small></div></footer>;
}
