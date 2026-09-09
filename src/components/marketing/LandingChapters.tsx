import Link from "next/link";
import { LiquidLink } from "./LiquidLink";
import { DemoRequestLink } from "./DemoRequestLink";
import { MarketingPublicBrand as MarketingBrand } from "./MarketingBrandTile";
import { ArrowRightIcon, DocumentTextIcon, UserIcon, ListBulletIcon, ShieldCheckIcon, FlagIcon } from "@heroicons/react/24/outline";
import { WorkbookEvidence } from "./WorkbookEvidence";
import { QualificationRouter } from "./QualificationRouter";
import { WorkflowDemo } from "./WorkflowDemo";
import { CommercialThread, ConnectedEcosystem, EvaluatedEcosystem, MeasurementScene, TrustArchitecture } from "./LandingVisuals";
import s from "./chapters.module.css";
import p from "./final-polish.module.css";
import r from "./reference.module.css";
import { ReferenceComparison } from "./ReferenceComparison";
import { ChapterMotion } from "./ChapterMotion";

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
  return <div className={`${s.chapters} ${r.page}`}>
    <section id="cum-functioneaza" className={`${s.chapter} ${s.light}`} aria-labelledby="commercial-break-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>01 / Unde se pierde continuitatea</p><h2 id="commercial-break-title">Oferta a plecat.<br />Următorul pas nu trebuie să dispară.</h2></div><p className={s.lead}>Un termen promis. O conversație rămasă deschisă. ReveNew aduce la vedere ce trebuie verificat, cine răspunde și ce urmează.</p></div>
      <p className={r.disclosure}>Scenariu demonstrativ · companii și valori de exemplu</p><CommercialThread />
    </div></section>

    <section id="ce-se-schimba" className={`${s.chapter} ${s.neutral}`} aria-labelledby="change-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>02 / Ce se schimbă cu ReveNew</p><h2 id="change-title">Din informații răspândite,<br />un caz cu un pas clar.</h2></div><p className={s.lead}>Informațiile există deja. ReveNew le leagă într-un caz cu dovezi, un responsabil și o continuare de verificat.</p></div>
      <ReferenceComparison />
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

    <section id="ecosistem-evaluare" className={`${s.chapter} ${s.deep}`} aria-label="Evaluarea altor sisteme"><div className={s.container}><EvaluatedEcosystem /></div></section>

    <section id="dovezi" className={`${s.chapter} ${s.neutral}`} aria-label="Dovezi inspectabile"><div className={s.container}><WorkbookEvidence /></div></section>

    <section id="securitate" className={`${s.chapter} ${s.deep}`} aria-labelledby="trust-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>07 / Cine vede și cine decide</p><h2 id="trust-title">Controlul rămâne<br />în compania ta.</h2></div><p className={s.lead}>Cine vede informația, cine aprobă și pe ce dovezi se bazează decizia rămân explicite.</p></div><TrustArchitecture />
    </div></section>

    <section id="potrivire" className={`${s.chapter} ${s.light}`} aria-labelledby="fit-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>08 / Potrivire comercială</p><h2 id="fit-title">Vezi unde s-ar aplica<br />în compania ta.</h2></div><p className={s.lead}>Alege un proces pe care îl recunoști. Vezi de ce merită urmărit și unde se poate pierde continuitatea.</p></div>
      <QualificationRouter />
    </div></section>

    <section id="incepem" className={`${s.chapter} ${s.deep} ${s.collaborationStart}`} aria-labelledby="start-title"><div className={s.container}>
      <div className={s.heading}><div><p className={s.overline}>09 / Colaborarea</p><h2 id="start-title">Începem cu<br />un singur proces.</h2></div><p className={s.lead}>Păstrăm sistemele și felul în care lucrează echipa. Alegem un flux real și aducem în față cazurile care cer atenție.</p></div>

      <ChapterMotion name="collaboration" duration={550} className={r.collaboration}><ol className={p.startRail} aria-label="Cum începe colaborarea" data-enter="1">
        <li className={p.startStep}>
          <div className={p.startStepTop}><span className={p.startIndex}>01</span><h3>Alegem procesul</h3></div>
          <p>Identificăm un flux comercial real unde continuitatea contează.</p>
        </li>
        <li className={p.startStep}>
          <div className={p.startStepTop}><span className={p.startIndex}>02</span><h3>Confirmăm sursele și accesul</h3></div>
          <p>Lucrăm doar cu contextul necesar și autorizat.</p>
        </li>
        <li className={p.startStep}>
          <div className={p.startStepTop}><span className={p.startIndex}>03</span><h3>Aducem cazurile în fața echipei</h3></div>
          <p>Echipa vede cazul, dovezile și pasul pregătit.</p>
        </li>
      </ol>

      <div className={r.implementationOutput}>
        <div className={r.outputHeading}><span>Ce primește echipa</span><h3>Un caz pregătit pentru decizie.</h3><p>De la semnal la revizuire, într-un singur fir.</p></div>
        <div className={r.outputItems}>{[
          {title:"Prioritate clară",detail:"Ce cere atenție",Icon:FlagIcon},
          {title:"Dovadă",detail:"Fragmentul din sursă",Icon:DocumentTextIcon},
          {title:"Responsabil",detail:"Cine continuă cazul",Icon:UserIcon},
          {title:"Pas pregătit",detail:"Propunerea de verificat",Icon:ListBulletIcon},
          {title:"Revizuire umană",detail:"Decizia echipei",Icon:ShieldCheckIcon}
        ].map(({title,detail,Icon})=><div key={title}><Icon aria-hidden="true"/><strong>{title}</strong><span>{detail}</span></div>)}</div>
      </div>
      </ChapterMotion>
      <div className={r.implementationClose}><p>Prima discuție: responsabilul procesului și persoana care autorizează sursele.</p><LiquidLink href="/solicita-demo" variant="quiet">Discută cu noi despre primul proces <ArrowRightIcon aria-hidden="true"/></LiquidLink></div>
    </div></section>

    <section id="intrebari" className={`${s.chapter} ${s.faqSection}`} aria-labelledby="faq-title"><div className={`${s.container} ${s.faqLayout}`}>
      <div className={p.faqIntro}><p className={s.overline}>Întrebările deciziei</p><h2 id="faq-title">Înainte să începem.</h2><p className={s.lead}>Răspunsurile importante înainte să pui procesul și datele pe masă.</p></div>
      <ChapterMotion name="faq" duration={400} className={p.faqList}>
        {faqs.map(([question,answer], index)=><details className={p.faqItem} key={question} data-enter="1"><summary className={p.faqQuestion}><span className={p.faqNumber}>{String(index + 1).padStart(2,"0")}</span><span className={p.faqQuestionText}>{question}</span><span className={p.faqToggle} aria-hidden="true">+</span></summary><div className={p.faqAnswer}><p>{answer}</p></div></details>)}
      </ChapterMotion>
    </div></section>

    <section className={s.closing} id="urmatorul-pas" aria-labelledby="closing-title"><ChapterMotion name="closing" duration={450} className={s.container}><div className={s.closingMark} aria-hidden="true"><MarketingBrand /></div><h2 id="closing-title">Mai puțin context pierdut.<br />Mai multă claritate.</h2><p className={s.lead}>Pornim de la un proces real al companiei tale.</p><div className={s.closingActions}><DemoRequestLink material="primary" /><LiquidLink href="#produs" variant="quiet">Explorează produsul</LiquidLink></div></ChapterMotion></section>
  </div>;
}

export function MarketingFooter() {
  return <footer className={s.footer}><div className={`${s.container} ${s.footerInner}`}><div><Link prefetch={false} className={s.footerBrand} href="/" aria-label="ReveNew — pagina principală"><MarketingBrand /></Link><p>Context comercial. Dovezi. Un pas clar.</p></div><nav aria-label="Resurse și informații legale"><Link prefetch={false} href="/ghid">Ghid</Link><Link prefetch={false} href="/#integrari">Integrări</Link><Link prefetch={false} href="/privacy">Confidențialitate</Link><Link prefetch={false} href="/terms">Termeni și condiții</Link></nav><small>© {new Date().getFullYear()} ReveNew</small></div></footer>;
}
