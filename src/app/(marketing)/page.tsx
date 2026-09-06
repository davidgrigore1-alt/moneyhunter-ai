import type { Metadata } from "next";
import { ArrowDownIcon } from "@heroicons/react/24/outline";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { DemoRequestLink } from "@/components/marketing/DemoRequestLink";
import { LiquidLink } from "@/components/marketing/LiquidLink";
import { ProductTheatre } from "@/components/marketing/ProductTheatre";
import { marketingFont } from "@/components/marketing/font";
import { canonicalUrl } from "@/lib/seo";
import s from "@/components/marketing/landing.module.css";
import h from "@/components/marketing/hero.module.css";

export const metadata: Metadata = {
  title: "ReveNew | Din context comercial, un pas clar",
  description: "Vezi ce ofertă are nevoie de atenție, înțelege dovezile și pregătește următorul pas. Inteligență operațională pentru echipe B2B, cu decizia la tine.",
  alternates: { canonical: canonicalUrl("/") },
  openGraph: { title: "ReveNew | Din context comercial, un pas clar", description: "Oportunități, dovezi și următorul pas comercial, în același fir.", url: canonicalUrl("/"), locale: "ro_RO", type: "website" },
  twitter: { card: "summary", title: "ReveNew | Din context comercial, un pas clar", description: "Înțelege ce merită atenție. Decide următorul pas." }
};
export default function LandingPage() {
  return <div className={`${s.canvas} ${marketingFont.className}`}>
    <a href="#continut" className={s.skipLink}>Sari la conținut</a><MarketingNav />
    <main id="continut"><section className={h.hero} aria-labelledby="hero-title"><div className={h.container}>
      <div className={h.heroCopy}>
        <p className={h.eyebrow}><span aria-hidden="true" />Inteligență operațională · ReveNew</p>
        <h1 id="hero-title">Vezi unde se rupe execuția.<br /><span>Știi ce urmează.</span></h1>
        <p className={h.heroLead}>Oferte, conversații și documente, legate într-un context clar.<br className={h.desktopBreak} /> Vezi ce cere atenție și pregătește următorul pas comercial.</p>
        <div className={h.heroActions}><DemoRequestLink material="primary" /><LiquidLink href="#cum-functioneaza" variant="quiet">Vezi cum funcționează<ArrowDownIcon aria-hidden="true" /></LiquidLink></div>
        <p className={h.heroNote}>Dovezi la vedere. Decizia la tine.</p>
      </div><ProductTheatre />
    </div></section></main>
  </div>;
}
