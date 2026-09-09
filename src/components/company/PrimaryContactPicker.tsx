"use client";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Modal";
import { Button } from "@/components/ui/ProductButton";
import { Input } from "@/components/ui/Input";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createCompanyPrimaryContact, setCompanyPrimaryContact } from "@/lib/crm/workspace-actions";
import type { CompanyIntelligenceSnapshot } from "@/lib/company-intelligence";
export function PrimaryContactPicker({ companyId, contacts, label = "Alege contactul principal" }: { companyId: string; contacts: CompanyIntelligenceSnapshot["contacts"]; label?: string }) {
  const id = useId(); const router = useRouter();
  const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(""); const [creating, setCreating] = useState(false);
  const [requestId, setRequestId] = useState(""); const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); const [pending, startTransition] = useTransition();
  const related = contacts.filter(contact => contact.organizationId === companyId);
  const filtered = related.filter(contact => `${contact.fullName} ${contact.jobTitle ?? ""} ${contact.email ?? ""}`.toLocaleLowerCase("ro").includes(query.toLocaleLowerCase("ro")));
  function confirm(form?: FormData) {
    setError(""); startTransition(async () => {
      try {
        const result = creating && form
          ? await createCompanyPrimaryContact(companyId, requestId, form)
          : await setCompanyPrimaryContact(companyId, selected);
        if (!result.ok) { setError(result.error); return; }
        setOpen(false); setNotice(result.message); router.refresh();
      } catch { setError("Actualizarea nu a fost confirmată. Reîncearcă fără să părăsești compania."); }
    });
  }
  return <><Button type="button" variant="secondary" onClick={() => { setOpen(true); setCreating(false); setRequestId(crypto.randomUUID()); setError(""); setQuery(""); setSelected(related.find(c => c.isPrimary)?.id ?? ""); }}>{label}</Button>
    {notice ? <p role="status" className="text-sm text-[rgb(var(--text-secondary))]">{notice}</p> : null}
    {open ? <Dialog labelledBy={`${id}-title`} describedBy={`${id}-description`} onClose={() => setOpen(false)} dismissible={!pending}>
      <div className="flex items-start justify-between gap-3"><h2 id={`${id}-title`} className="text-xl font-semibold">Alege contactul principal</h2><Button variant="ghost" aria-label="Închide alegerea contactului" disabled={pending} onClick={() => setOpen(false)}><XMarkIcon width={18} /></Button></div>
      <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">Selectează persoana de referință pentru continuitatea acestei relații comerciale.</p>
      {creating ? <form onSubmit={event => { event.preventDefault(); confirm(new FormData(event.currentTarget)); }} className="mt-5 grid gap-4">
        <label className="text-sm">Nume complet<Input name="fullName" required maxLength={180} disabled={pending} /></label>
        <label className="text-sm">Rol în companie<Input name="jobTitle" maxLength={140} disabled={pending} /></label>
        <label className="text-sm">Email · opțional<Input name="email" type="email" maxLength={254} disabled={pending} /></label>
        <Button type="submit" loading={pending}>Adaugă și setează contact principal</Button>
        <Button variant="ghost" disabled={pending} onClick={() => setCreating(false)}>Înapoi la contacte</Button>
      </form> : <>
        <label className="mt-5 block text-sm">Caută în contactele companiei<Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Nume, rol sau email" /></label>
        {filtered.length ? <fieldset className="my-4 grid max-h-72 gap-1 overflow-y-auto"><legend className="sr-only">Contacte asociate</legend>{filtered.map(contact => <label key={contact.id} className="flex min-h-16 cursor-pointer items-center gap-3 rounded-control border border-transparent p-3 has-[:checked]:border-[rgb(var(--primary)/0.4)] has-[:checked]:bg-[rgb(var(--surface-subtle))]">
          <input type="radio" name="primary-contact" value={contact.id} checked={selected === contact.id} onChange={() => setSelected(contact.id)} className="accent-[rgb(var(--primary))]" />
          <span className="min-w-0 text-sm"><strong className="block">{contact.fullName}</strong><span className="block text-[rgb(var(--text-secondary))]">{[contact.jobTitle,contact.email].filter(Boolean).join(" · ") || "Rol necompletat"}</span><span className="text-xs text-[rgb(var(--text-muted))]">{contact.opportunityCount} oportunități asociate{contact.isPrimary ? " · Principal" : ""}</span></span>
        </label>)}</fieldset> : <p className="my-5 text-sm text-[rgb(var(--text-muted))]">{related.length ? "Niciun contact nu corespunde căutării." : "Nu există contacte asociate. Adaugă persoana de referință mai jos."}</p>}
        <div className="grid gap-2 border-t border-[rgb(var(--border))] pt-4">{related.length ? <Button loading={pending} disabled={!selected} onClick={() => confirm()}>Setează drept contact principal</Button> : null}<Button variant={related.length ? "secondary" : "primary"} disabled={pending} onClick={() => setCreating(true)}>Adaugă un contact nou</Button></div>
      </>}{error ? <p role="alert" className="mt-3 text-sm text-[rgb(var(--danger-text))]">{error}</p> : null}
    </Dialog> : null}</>;
}
