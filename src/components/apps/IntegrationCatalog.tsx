"use client";
import { useState } from "react";
import { ApplicationLogo } from "./ApplicationLogo";
import { AvailableSources } from "./AvailableSources";
import { integrationCatalog, type IntegrationCatalogItem } from "@/lib/integrations/catalog";
import type { GoogleWorkspacePublicState } from "@/lib/google-workspace/types";
import { SegmentedFilter } from "@/components/ui/SegmentedFilter";
import styles from "./Ecosystem.module.css";

export function IntegrationCatalog({ state, onSelect }: { state: GoogleWorkspacePublicState; onSelect: (item: IntegrationCatalogItem) => void }) {
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("Toate");
  const categories = ["Toate", "Comunicare", "CRM", "Documente", "Contracte", "Platformă"];
  const items = integrationCatalog.filter(item => item.stage !== "implemented" && (category === "Toate" || item.category === category) && `${item.name} ${item.description}`.toLocaleLowerCase("ro").includes(query.trim().toLocaleLowerCase("ro")));
  return <div className="grid gap-8"><AvailableSources state={state} />
    <section className={styles.evaluation} aria-label="Evaluare înainte de implementare">
      <header><h2>Evaluare înainte de implementare</h2><p>Conectarea se stabilește pentru procesul tău. Sistemele de mai jos nu sunt integrări active.</p></header>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input className="focus-ring min-h-10 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm" value={query} onChange={event=>setQuery(event.target.value)} aria-label="Caută aplicații" placeholder="Caută un sistem…" />
        <SegmentedFilter label="Categorie de aplicații" options={categories.map(id=>({id,label:id}))} value={category} onChange={setCategory} />
      </div>
      <div className={styles.grid}>{items.map(item=><button key={item.id} type="button" className={`focus-ring ${styles.card}`} onClick={()=>onSelect(item)} aria-haspopup="dialog">
        <ApplicationLogo item={item} /><h3>{item.name}</h3><p>{item.description}</p><small>Evaluare înainte de implementare</small><p>Vezi condițiile evaluării →</p>
      </button>)}</div>
      {!items.length ? <p role="status" className="py-6 text-sm text-[rgb(var(--text-muted))]">Niciun sistem nu corespunde filtrelor.</p> : null}
    </section>
  </div>;
}
