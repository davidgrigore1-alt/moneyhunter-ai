"use client";

import { useState } from "react";
import { EvidenceInspector } from "./EvidenceInspector";
import styles from "./Evidence.module.css";
import controls from "@/components/ui/PremiumControls.module.css";
import Link from "next/link";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { ArrowUpRightIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon, BoltIcon, BuildingOffice2Icon, UserIcon } from "@heroicons/react/24/outline";
import { IntegrationBrandIcon } from "@/components/ui/IntegrationBrandIcon";
import { evidenceHref, evidenceSourceLabels, type EvidenceReference } from "@/lib/evidence-reference";
import { formatProductDateTime } from "@/lib/ui/presentation";

function EvidenceRow({ item }: { item: EvidenceReference }) {
  const href = evidenceHref(item.entityHref);
  const [inspecting, setInspecting] = useState(false);
  const Icon = item.sourceType === "document" ? DocumentTextIcon : item.sourceType === "action" || item.sourceType === "approval" ? CheckCircleIcon
    : item.sourceType === "signal" ? BoltIcon : item.sourceType === "opportunity" ? BuildingOffice2Icon : item.sourceType === "contact" ? UserIcon : ClockIcon;
  return <li className={styles.row}>
    {item.provider === "google_drive" && item.mimeType ? <DocumentTypeIcon mime={item.mimeType} /> : item.provider ? <IntegrationBrandIcon provider={item.provider} size="small" /> : <span className="grid h-6 w-6 shrink-0 place-items-center text-[rgb(var(--text-muted))]"><Icon className="h-4 w-4" aria-hidden="true" /></span>}
    <div className={styles.body}>
      <div className={styles.meta}>
        <span>{evidenceSourceLabels[item.sourceType]}</span>
        {item.occurredAt ? <time dateTime={item.occurredAt}>{formatProductDateTime(item.occurredAt, { year: false })}</time> : <span>Dată neconfirmată</span>}
      </div>
      {href ? <Link href={href} className={`focus-ring inline-flex items-start gap-1 hover:underline ${styles.title}`}>
        <span className="break-words [overflow-wrap:anywhere]">{item.title}</span><ArrowUpRightIcon className="mt-1 h-3 w-3 shrink-0 text-[rgb(var(--text-muted))]" aria-hidden="true" />
      </Link> : <p className={styles.title}>{item.title}</p>}
      {item.supportingFact ? <p className={styles.fact}>{item.supportingFact}</p> : null}
      {item.visibility === "authorized_content" ? <p className={styles.fact}>{item.excerpt}</p> : null}
      {item.sourceLocation || item.sourceVersion ? <p className={styles.fact}>{[item.sourceLocation, item.sourceVersion ? `Versiune ${item.sourceVersion}` : null].filter(Boolean).join(" · ")}</p> : null}
      {item.provider === "google_drive" ? <p className={styles.fact}>Copie extrasă · acces actual de verificat</p> : null}
      <button type="button" className={`focus-ring ${styles.inspect}`} onClick={() => setInspecting(true)} aria-label={`Inspectează dovada: ${item.title}`}>Inspectează proveniența →</button>
    </div>
    {inspecting ? <EvidenceInspector title={item.title} onClose={() => setInspecting(false)}
      fact={item.visibility === "authorized_content" ? item.excerpt : item.supportingFact}
      metadata={[
        { label: "Sursă", value: evidenceSourceLabels[item.sourceType] },
        { label: "Data sursei", value: item.occurredAt ? formatProductDateTime(item.occurredAt) : "Neconfirmată" },
        { label: "Conținut", value: item.visibility === "authorized_content" ? "Fragment autorizat" : "Metadate și context autorizat; corpul sursei nu este inclus" },
        ...(item.sourceLocation ? [{ label: "Poziție", value: item.sourceLocation }] : []),
        ...(item.sourceVersion ? [{ label: "Versiune", value: item.sourceVersion }] : []),
        ...(item.syncedAt ? [{ label: "Sincronizare", value: formatProductDateTime(item.syncedAt) }] : []),
        ...(item.commercialRelationship ? [{ label: "Legătură", value: item.commercialRelationship }] : [])
      ]}
      boundary="Aceasta este proiecția disponibilă pentru caz. O declarație din sursă nu confirmă independent un rezultat comercial. Deschiderea sursei verifică accesul curent."
      sourceAction={href ? <a href={href} className={`focus-ring mt-4 inline-flex px-3 py-2 text-sm ${controls.secondary}`}>Deschide sursa autorizată →</a> : undefined}
    /> : null}
  </li>;
}

/** Shared evidence presentation, independent of the originating workspace. */
export function EvidenceList({ items, limit = 4, label = "Dovezi" }: { items: EvidenceReference[]; limit?: number; label?: string }) {
  if (!items.length) return <p className={styles.empty}>Nu există surse disponibile pentru această secțiune.</p>;
  const render = (rows: EvidenceReference[]) => <ul aria-label={label} className="divide-y divide-[rgb(var(--border))]">{rows.map((item) => <EvidenceRow key={item.sourceType + ":" + item.sourceId} item={item} />)}</ul>;
  return <div>{render(items.slice(0, limit))}{items.length > limit ? <details className="border-t border-[rgb(var(--border))]">
    <summary className={`focus-ring py-3 text-xs text-[rgb(var(--text-muted))] ${controls.disclosure}`}>{label === "Dovezi" ? "Vezi toate dovezile" : "Vezi toată activitatea"} ({items.length})</summary>
    {render(items.slice(limit))}
  </details> : null}</div>;
}
