import { DemoNotice } from "@/components/dashboard/DemoNotice";
import { PageShell } from "@/components/dashboard/PageShell";
import { OpportunitiesExplorer } from "@/components/opportunities/OpportunitiesExplorer";
import { Button } from "@/components/ui/ProductButton";
import { getCurrentBusinessOrDemo, getOpportunitiesForCurrentBusiness } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/status";
import { OpportunityFilters, type OpportunityFilterState } from "@/components/filters/OpportunityFilters";
import { SavedViewControls } from "@/components/filters/SavedViewControls";
import { getSavedViews } from "@/lib/saved-views/actions";
import { assessOpportunityAttention } from "@/lib/opportunity-attention";
import { applicationDateKey, lifecycleForOpportunity } from "@/lib/opportunity-domain";
import Link from "next/link";
import { CreateOpportunityPanel } from "@/components/opportunities/CreateOpportunityPanel";
import { getAssignableProfilesForCurrentBusiness, getCrmWorkspaceForCurrentBusiness } from "@/lib/revenue-workspace";

export default async function OpportunitiesPage(
  props: { searchParams: Promise<OpportunityFilterState & { page?: string; create?: string }> }
) {
  const searchParams = await props.searchParams;
  await getCurrentBusinessOrDemo({ redirectIfMissing: true });
  const [allOpportunities, savedViews, crm, assignableProfiles] = await Promise.all([getOpportunitiesForCurrentBusiness(), getSavedViews("opportunities"), getCrmWorkspaceForCurrentBusiness(), getAssignableProfilesForCurrentBusiness()]);
  const today = applicationDateKey();
  const query = (searchParams.q ?? "").trim().toLocaleLowerCase("ro-RO").slice(0, 120);
  const filtered = allOpportunities.filter((opportunity) => {
    if (query && !`${opportunity.title} ${opportunity.summary} ${opportunity.recommendedAction}`.toLocaleLowerCase("ro-RO").includes(query)) return false;
    if (searchParams.status && opportunity.status !== searchParams.status) return false;
    if (searchParams.lifecycle && lifecycleForOpportunity(opportunity) !== searchParams.lifecycle) return false;
    if (searchParams.commercialType && opportunity.commercialType !== searchParams.commercialType) return false;
    if (searchParams.attention && assessOpportunityAttention(opportunity).state !== searchParams.attention) return false;
    const pending = opportunity.actions.filter((action) => action.status === "pending");
    if (searchParams.due === "overdue" && !pending.some((action) => action.dueDate && action.dueDate.slice(0, 10) < today)) return false;
    if (searchParams.due === "today" && !pending.some((action) => action.dueDate?.slice(0, 10) === today)) return false;
    if (searchParams.due === "missing" && !assessOpportunityAttention(opportunity).reasons.some(reason => reason.code === "missing_next_action")) return false;
    const hasPrimary = Boolean(opportunity.contacts?.some((contact) => contact.isPrimary));
    if (searchParams.contact === "present" && !hasPrimary) return false;
    if (searchParams.contact === "missing" && hasPrimary) return false;
    const hasDecisionMaker = Boolean(opportunity.contacts?.some((contact) => contact.contact.decisionRole === "decision_maker" || contact.role === "decision_maker"));
    if (searchParams.decisionMaker === "present" && !hasDecisionMaker) return false;
    if (searchParams.decisionMaker === "missing" && hasDecisionMaker) return false;
    return true;
  }).sort((a, b) => {
    if (searchParams.sort === "value") return (a.currency ?? "RON").localeCompare(b.currency ?? "RON") || b.estimatedValueHigh - a.estimatedValueHigh;
    if (searchParams.sort === "attention") return assessOpportunityAttention(b).reasons.length - assessOpportunityAttention(a).reasons.length;
    return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
  });
  const pageSize = 25;
  const page = Math.max(1, Math.min(Math.floor(Number(searchParams.page) || 1), Math.ceil(filtered.length / pageSize) || 1));
  const opportunities = filtered.slice((page - 1) * pageSize, page * pageSize);
  const firstOpportunityCta = isSupabaseConfigured && allOpportunities.length === 0;
  const currentQuery = new URLSearchParams(Object.entries(searchParams).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1]))).toString();
  const attentionCount = filtered.filter((opportunity) => !["on_track", "closed"].includes(assessOpportunityAttention(opportunity).state)).length;
  const missingOwnerCount = filtered.filter((opportunity) => !opportunity.ownerProfileId).length;
  const dueCount = filtered.filter((opportunity) => opportunity.actions.some((action) => action.status === "pending" && action.dueDate && action.dueDate.slice(0, 10) <= today)).length;

  return (
    <PageShell
      entity="opportunities"
      wide
      eyebrow="Oportunități"
      title="Oportunități comerciale"
      description="Responsabil, următorul pas și termenul fiecărei oportunități."
      actions={<div className="flex flex-wrap gap-2"><Button href="/opportunities/import" variant="secondary">Importă CSV</Button>{crm.ready && crm.organizations.length > 0 ? <CreateOpportunityPanel organizations={crm.organizations} assignableProfiles={assignableProfiles} initialOpen={searchParams.create === "1"} /> : <Button href="/companies">Adaugă prima companie</Button>}<Button href="/opportunities/analyze" variant="secondary">{firstOpportunityCta ? "Analizează prima oportunitate" : "Analiză asistată"}</Button></div>}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        {!isSupabaseConfigured ? <DemoNotice /> : null}
        <section aria-labelledby="registry-controls-heading" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
          <h2 id="registry-controls-heading" className="sr-only">Filtre oportunități</h2>
          <OpportunityFilters filters={searchParams} savedViews={<SavedViewControls views={savedViews} currentQuery={currentQuery} targetPage="opportunities" />} />
        </section>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[rgb(var(--border))] pb-3 text-xs text-[rgb(var(--text-muted))]"><span><strong className="text-[rgb(var(--foreground))]">{filtered.length}</strong> în selecția curentă</span><span><strong className="text-[rgb(var(--warning-text))]">{attentionCount}</strong> necesită atenție</span><span><strong className="text-[rgb(var(--foreground))]">{missingOwnerCount}</strong> fără responsabil</span><span><strong className="text-[rgb(var(--foreground))]">{dueCount}</strong> scadente sau restante</span><span className="ml-auto">{allOpportunities.length} accesibile · pagina {page}</span></div>
        <OpportunitiesExplorer
          opportunities={opportunities}
          emptyTitle={allOpportunities.length > 0 ? "Nicio oportunitate nu corespunde filtrelor." : isSupabaseConfigured ? "Nu ai oportunități reale încă." : undefined}
          emptyDescription={
            allOpportunities.length > 0
              ? "Ajustează sau resetează filtrele pentru a vedea alte oportunități comerciale."
              : isSupabaseConfigured
                ? "Oportunitățile apar manual sau prin convertirea semnalelor din Inbox Comercial. Începe cu un lead pierdut, o cerere veche sau un follow-up ratat."
                : undefined
          }
          emptyCtaLabel={allOpportunities.length ? "Resetează filtrele" : isSupabaseConfigured ? "Deschide Inbox Comercial" : undefined}
          emptyCtaHref={allOpportunities.length ? "/opportunities" : isSupabaseConfigured ? "/inbox" : undefined}
        />
        {filtered.length > pageSize ? <nav className="flex justify-end gap-2" aria-label="Paginare oportunități">
          {page > 1 ? <Link className="focus-ring rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold" href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(currentQuery)), page: String(page - 1) })}`}>Înapoi</Link> : null}
          {page * pageSize < filtered.length ? <Link className="focus-ring rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold" href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(currentQuery)), page: String(page + 1) })}`}>Înainte</Link> : null}
        </nav> : null}
      </div>
    </PageShell>
  );
}
