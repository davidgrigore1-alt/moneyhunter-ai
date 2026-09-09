import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import { submitDemoRequest } from "@/lib/marketing/lead-capture-actions";
import { marketingFont } from "@/components/marketing/font";
import { canonicalUrl } from "@/lib/seo";
import s from "@/components/marketing/landing.module.css";

export const metadata: Metadata = {
  title: "Discută cu ReveNew",
  description: "Vezi ReveNew în contextul companiei tale și al procesului comercial pe care vrei să-l îmbunătățești.",
  alternates: { canonical: canonicalUrl("/solicita-demo") },
  robots: { index: false, follow: true }
};

export default function RequestDemoPage() {
  return <div className={`${s.canvas} ${s.requestPage} ${marketingFont.className}`}><Link prefetch={false} href="#formular-demo" className={s.skipLink}>Sari la formular</Link><MarketingNav /><main className={`${s.container} ${s.requestGrid}`}>
    <div className={s.requestCopy}><Link prefetch={false} href="/" className={s.backLink}><ArrowLeftIcon aria-hidden="true" />Înapoi la ReveNew</Link><p className={s.chapterLabel}>O discuție despre procesul tău</p><h1>Vezi ReveNew în contextul companiei tale.</h1><p>Spune-ne câteva lucruri despre compania ta și despre procesul comercial pe care vrei să-l îmbunătățești.</p><div className={s.requestPromise}><span aria-hidden="true">↳</span><p>Oferte de urmărit. Responsabilități de clarificat. Un pas care merită pus în mișcare.</p></div></div>
    <section id="formular-demo" aria-label="Formular de contact comercial"><DemoRequestForm submitRequest={submitDemoRequest} /></section>
  </main><footer className={`${s.container} ${s.requestFooter}`}><span>ReveNew</span><Link prefetch={false} href="/privacy">Confidențialitate</Link><Link prefetch={false} href="/terms">Termeni și condiții</Link></footer></div>;
}
