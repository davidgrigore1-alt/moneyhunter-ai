import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import { submitDemoRequest } from "@/lib/marketing/lead-capture-actions";
import { marketingFont } from "@/components/marketing/font";
import { canonicalUrl } from "@/lib/seo";
import s from "@/components/marketing/contact.module.css";

export const metadata: Metadata = {
  title: "Discută cu ReveNew",
  description:
    "Spune-ne unde se rupe execuția comercială. ReveNew începe cu un singur proces, dovezi clare și un următor pas verificabil.",
  alternates: { canonical: canonicalUrl("/solicita-demo") },
  robots: { index: false, follow: true }
};

const proofItems = [
  {
    icon: CheckBadgeIcon,
    title: "Un singur proces",
    text: "Începem cu problema comercială care merită verificată acum."
  },
  {
    icon: ShieldCheckIcon,
    title: "Dovezi înainte de concluzii",
    text: "Separăm ce știm, ce estimăm și ce trebuie confirmat."
  },
  {
    icon: LockClosedIcon,
    title: "Control uman",
    text: "Nicio acțiune comercială externă nu este aplicată automat."
  }
] as const;

const afterSteps = [
  {
    eyebrow: "Încadrare",
    title: "Problema",
    text: "Clarificăm unde apare ruptura și ce date există deja."
  },
  {
    eyebrow: "Potrivire",
    title: "Procesul",
    text: "Vedem dacă ReveNew poate produce un caz verificabil."
  },
  {
    eyebrow: "Decizie",
    title: "Următorul pas",
    text: "Pilot, implementare sau concluzia că nu este momentul potrivit."
  }
] as const;

export default function RequestDemoPage() {
  return (
    <div className={`${s.page} ${marketingFont.className}`}>
      <Link prefetch={false} href="#formular-demo" className={s.skipLink}>
        Sari la formular
      </Link>

      <MarketingNav />

      <main>
        <section className={s.hero}>
          <div className={s.ambient} aria-hidden="true" />

          <div className={s.heroGrid}>
            <div className={s.copyColumn}>
              <Link prefetch={false} href="/" className={s.backLink}>
                <ArrowLeftIcon aria-hidden="true" />
                Înapoi la ReveNew
              </Link>

              <p className={s.eyebrow}>Discuție executivă · pe procesul tău</p>

              <h1>
                Pornim de la procesul care <span>merită reparat.</span>
              </h1>

              <p className={s.lead}>
                Nu începem cu un tur de funcții. Începem cu locul în care
                execuția comercială se rupe: follow-up, responsabilitate,
                ofertă, aprobare sau următorul pas.
              </p>

              <div className={s.proofStack}>
                {proofItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className={s.proofItem} key={item.title}>
                      <span className={s.proofIcon}>
                        <Icon aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={s.commercialNote} aria-label="Moduri de lucru ReveNew">
                <div>
                  <span>Pilot controlat</span>
                  <strong>14 zile · un proces</strong>
                </div>
                <div>
                  <span>Operare recurentă</span>
                  <strong>după dovadă</strong>
                </div>
                <div>
                  <span>Enterprise</span>
                  <strong>scoping separat</strong>
                </div>
              </div>

              <p className={s.priceFootnote}>
                Scopul și prețul se confirmă transparent înainte de activare.
                Nu este necesar să creezi un cont pentru a începe discuția.
              </p>
            </div>

            <section
              id="formular-demo"
              className={s.formShell}
              aria-labelledby="request-form-heading"
            >
              <div className={s.formHalo} aria-hidden="true" />

              <div className={s.formHeader}>
                <div className={s.formTopline}>
                  <p className={s.formEyebrow}>Context comercial</p>
                  <span className={s.noAccountPill}>Fără cont</span>
                </div>

                <h2 id="request-form-heading">Spune-ne unde se rupe execuția.</h2>

                <p>
                  Nume, email și companie sunt suficiente pentru început.
                  Contextul procesului ne ajută să evităm o discuție generică.
                </p>
              </div>

              <DemoRequestForm submitRequest={submitDemoRequest} />
            </section>
          </div>
        </section>

        <section className={s.afterSection} aria-label="Ce urmează">
          <div className={s.afterInner}>
            <div className={s.afterCopy}>
              <p className={s.afterEyebrow}>După trimitere</p>
              <h2>O discuție scurtă. Un proces concret.</h2>
              <p>
                Fără presiune de checkout. Fără prezentare standard înainte să înțelegem contextul.
              </p>
            </div>

            <div className={s.afterBoard}>
              <div className={s.afterBoardLine} aria-hidden="true" />
              {afterSteps.map((item, index) => (
                <div className={s.afterStage} key={item.title}>
                  <div className={s.afterStageHead}>
                    <span>{item.eyebrow}</span>
                    {index < afterSteps.length - 1 ? (
                      <ArrowRightIcon aria-hidden="true" />
                    ) : null}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <span className={s.footerBrand}>ReveNew</span>
          <span className={s.footerLine}>Control. Claritate. Impact verificabil.</span>
          <div className={s.footerLinks}>
            <Link prefetch={false} href="/privacy">Confidențialitate</Link>
            <Link prefetch={false} href="/terms">Termeni și condiții</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
