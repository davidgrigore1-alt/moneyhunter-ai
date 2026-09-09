"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { BookmarkIcon, ChevronDownIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/ProductButton";
import { Input } from "@/components/ui/Input";
import { createSavedView, deleteSavedView, renameSavedView } from "@/lib/saved-views/actions";
type SavedView = { id: string; name: string; filter_state: Record<string, string> | null };
export function SavedViewControls({ views, currentQuery, targetPage }: { views: SavedView[]; currentQuery: string; targetPage: string; summary?: ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState(views);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => setItems(views), [views]);
  function save() {
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const form = new FormData(); form.set("name", name); form.set("targetPage", targetPage); form.set("query", currentQuery);
        const result = editing ? await renameSavedView(editing, name) : await createSavedView(form);
        if (!result.ok || !result.view) { setError(result.error ?? "Salvarea a eșuat."); return; }
        const saved = result.view;
        setItems(current => [saved, ...current.filter(view => view.id !== saved.id)]);
        setName(""); setEditing(null); setMessage("Vizualizarea a fost salvată."); router.refresh();
      } catch { setError("Vizualizarea nu a putut fi salvată. Încearcă din nou."); }
    });
  }
  return <details className="group py-2" aria-label="Vizualizări salvate">
    <summary className="focus-ring inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control px-2 text-sm font-medium marker:hidden hover:bg-[rgb(var(--surface-muted))]">
      <BookmarkIcon className="size-4 shrink-0" aria-hidden="true" />Vizualizări salvate <span className="text-[rgb(var(--text-muted))]">{items.length}</span><ChevronDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
    </summary>
    <div className="grid max-w-2xl gap-4 py-3">
      <p className="text-sm text-[rgb(var(--text-secondary))]">Salvează filtrele și sortarea curentă pentru acces rapid.<br />Vizualizările tale nu sunt partajate cu echipa.</p>
      {!items.length ? <p className="text-sm text-[rgb(var(--text-muted))]">Nu ai încă vizualizări salvate.<br />Aplică filtrele dorite, dă-le un nume și salvează configurația.</p> : <ul className="divide-y divide-[rgb(var(--border))]">{items.map(view => <li key={view.id} className="flex items-center gap-2 py-1">
        <button type="button" className="focus-ring min-h-11 min-w-0 flex-1 rounded-control text-left text-sm font-medium" onClick={() => { const query = new URLSearchParams(view.filter_state ?? {}).toString(); router.push(`/${targetPage}${query ? `?${query}` : ""}`); }}>{view.name}</button>
        <Button variant="ghost" size="small" disabled={pending} aria-label={`Redenumește ${view.name}`} onClick={() => { setEditing(view.id); setName(view.name); setMessage(""); }}><PencilIcon width={16} /></Button>
        <Button variant="ghost" size="small" disabled={pending} aria-label={`Șterge vizualizarea ${view.name}`} onClick={() => startTransition(async () => { setError(""); setMessage(""); try { const result = await deleteSavedView(view.id); if (!result.ok) { setError("Vizualizarea nu a putut fi ștearsă."); return; } setItems(current => current.filter(item => item.id !== view.id)); setMessage("Vizualizarea a fost ștearsă."); router.refresh(); } catch { setError("Ștergerea a eșuat. Încearcă din nou."); } })}><TrashIcon width={16} /></Button>
      </li>)}</ul>}
      <form onSubmit={event => { event.preventDefault(); save(); }} className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-48 flex-1 gap-1.5 text-sm">Nume vizualizare<Input value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="Exemplu: Follow-up urgent" className="h-11" /></label>
        <Button type="submit" variant="secondary" className="h-11 self-end" loading={pending} disabled={!name.trim()}>{editing ? "Salvează numele" : "Salvează vizualizarea"}</Button>
        {editing ? <Button variant="ghost" onClick={() => { setEditing(null); setName(""); }}>Anulează</Button> : null}
      </form>
      {message ? <p role="status" className="text-sm">{message}</p> : null}{error ? <p role="alert" className="text-sm text-[rgb(var(--danger-text))]">{error}</p> : null}
    </div>
  </details>;
}
