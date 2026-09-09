import { ForbiddenState } from "@/components/authz/ForbiddenState";
import { PageShell } from "@/components/dashboard/PageShell";
import { getAuthorizationContext } from "@/lib/authz/get-authorization-context";
import { hasPermission } from "@/lib/authz/has-permission";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function AcquisitionLeadsPage() {
  const authorization = await getAuthorizationContext();
  if (!hasPermission(authorization, "platform.admin.access")) return <ForbiddenState title="Acces rezervat administratorilor platformei." description="Cererile publice nu fac parte din portofoliul unei companii." />;
  const client = await createSupabaseServerClient();
  const result = client ? await client.from("marketing_demo_requests").select("id,name,email,company,phone,goal,created_at,contact_consent_at").order("created_at", { ascending: false }).limit(100) : null;
  return <PageShell eyebrow="Administrare platformă" title="Solicitări de demo" description="Cele mai recente 100 de cereri înregistrate pe site. Contactarea se face separat, după verificare.">
    {!result || result.error ? <p role="alert" className="text-sm">Cererile nu au putut fi încărcate. Reîncarcă pagina.</p> : !result.data.length ? <p className="text-sm">Nu există solicitări înregistrate.</p> : <ol className="divide-y divide-[rgb(var(--border))]">{result.data.map(lead => <li key={lead.id} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="min-w-0 break-words"><h2 className="text-base font-semibold">{lead.company}</h2><p className="mt-1 text-sm">{lead.name}</p><p className="text-sm">{lead.email}</p>{lead.phone ? <p className="text-sm">{lead.phone}</p> : null}<p className="mt-2 text-xs text-[rgb(var(--text-muted))]">{new Date(lead.created_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })} · Contact solicitat</p></div>
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{lead.goal || "Fără detalii suplimentare."}</p>
    </li>)}</ol>}
  </PageShell>;
}
