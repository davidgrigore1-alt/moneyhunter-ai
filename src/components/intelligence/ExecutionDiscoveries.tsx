import Link from "next/link";
import type { InterventionBrief } from "@/lib/commercial-interventions-server";
import type { CompanyRegistrySnapshot } from "@/lib/crm/company-registry";
import { formatProductCurrency } from "@/lib/ui/presentation";
export function ExecutionDiscoveries({ brief, companies }: { brief: InterventionBrief | null; companies?: CompanyRegistrySnapshot }) {
  const missingContacts = companies?.coverage.contacts && companies.coverage.organizations ? companies.rows.filter(row => !row.primaryContact).slice(0,5) : [];
  return <section aria-labelledby="execution-discoveries-title" className="mb-6">
    <h2 id="execution-discoveries-title" className="text-xl font-semibold">Ce merită verificat în portofoliu</h2>
    <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Situații identificate din datele autorizate, fără să pornești o analiză.</p>
    {!brief ? <p role="status" className="mt-4 text-sm">Contextul de execuție nu este disponibil momentan. Reîncarcă pentru a reîncerca.</p> : !brief.items.length && !missingContacts.length ? <p className="mt-4 text-sm">Nicio situație identificată în selecția disponibilă. Verifică sursele pentru acoperire.</p> : null}
    <div className="mt-5 grid gap-3 lg:grid-cols-2">{brief?.items.slice(0,8).map(item => <article key={item.id} className="rounded-panel border border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-5">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="text-base font-semibold">{item.company}</h3>{item.estimatedExposure !== null ? <span className="text-sm tabular-nums">{formatProductCurrency(item.estimatedExposure,item.currency)} <span className="text-[rgb(var(--text-muted))]">estimat</span></span> : null}</div>
      <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{item.title}</p><p className="mt-3 text-sm font-medium">{item.summary}</p>
      <p className="mt-3 text-sm">{item.recommendation}</p><p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Responsabil · {item.owner || "Neatribuit"}</p>
      <details className="mt-3 text-sm"><summary className="focus-ring cursor-pointer py-2">{item.evidence.length} dovezi și motive</summary><ul className="grid gap-2">{item.reasons.map(reason => <li key={reason.type}>{reason.label}</li>)}{item.evidence.map(source => <li key={source.id}><Link className="focus-ring underline underline-offset-4" href={source.href}>{source.label}</Link></li>)}</ul></details>
      <Link href={item.reviewHref || `/opportunities/${item.opportunityId}`} className="focus-ring mt-3 inline-flex min-h-11 items-center text-sm font-semibold">Verifică următorul pas →</Link>
    </article>)}{missingContacts.map(({organization}) => <article key={organization.id} className="rounded-panel border border-[rgb(var(--border))] p-5"><h3 className="font-semibold">{organization.name}</h3><p className="mt-3 text-sm">Contactul principal lipsește în datele disponibile. Continuitatea relației are nevoie de o persoană de referință.</p><p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Sursă · profilul companiei și contactele asociate.</p><Link href={`/crm/organizations/${organization.id}?tab=contacts`} className="focus-ring mt-3 inline-flex min-h-11 items-center text-sm font-semibold">Alege contactul principal →</Link></article>)}</div>
  </section>;
}
