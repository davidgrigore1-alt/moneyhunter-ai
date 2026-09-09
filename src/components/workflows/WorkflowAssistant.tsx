"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/ProductButton";
import { WorkflowDraftPreview } from "@/components/intelligence/WorkflowDraftPreview";
import type { CopilotAnswer } from "@/lib/ai/copilot-types";
export function WorkflowAssistant() {
  const [request, setRequest] = useState(""); const [answer, setAnswer] = useState<CopilotAnswer | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const input = useRef<HTMLTextAreaElement>(null);
  async function propose() {
    if (loading || request.trim().length < 8) return;
    setLoading(true); setError(""); setAnswer(null);
    try {
      const response = await fetch("/api/ai/copilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: `Workflow: ${request}`.slice(0,1000), context: { route: "/workflows/new", pageType: "other" }, history: [], preparationIntent: false }) });
      const result = await response.json() as CopilotAnswer;
      if (!response.ok || !result.workflowDraft) throw new Error("Nu am putut pregăti definiția. Reformulează cererea sau folosește un playbook.");
      setAnswer(result);
    } catch { setError("Nu am putut pregăti definiția. Încearcă din nou sau folosește un playbook."); }
    finally { setLoading(false); }
  }
  return <section className="mx-auto w-full max-w-5xl" aria-labelledby="workflow-assistant-title">
    <h2 id="workflow-assistant-title" className="text-xl font-semibold">Descrie ce vrei să facă workflow-ul</h2>
    <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Spune când începe, ce trebuie verificat și ce propunere vrei să pregătească. Verifici draftul înainte de salvare.</p>
    <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Folosește datele oportunității din ReveNew. Poate pregăti un email sau o revizuire internă; nu citește automat Gmail ori Drive și nu trimite mesaje.</p>
    <form onSubmit={event => { event.preventDefault(); void propose(); }} className="mt-5 rounded-panel border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-subtle))] p-5">
      <label className="text-sm font-medium" htmlFor="workflow-request">Regula comercială</label>
      <textarea id="workflow-request" ref={input} value={request} onChange={event => setRequest(event.target.value)} maxLength={980} rows={3} placeholder="Când se creează o oportunitate, verifică dacă are responsabil și pregătește o revizuire." className="focus-ring mt-3 w-full resize-y rounded-control border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-base leading-6" />
      <Button type="button" variant="ghost" size="small" disabled={loading} onClick={() => { setRequest("Când se creează o oportunitate, verifică dacă are responsabil și pregătește un email pentru revizuire."); input.current?.focus(); }}>Folosește un exemplu</Button>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[rgb(var(--text-muted))]">Interpretare ghidată · fără model generativ · draft inactiv</p><Button type="submit" loading={loading} disabled={request.trim().length < 8}>Propune un draft</Button></div>
    </form>
    {error ? <p role="alert" className="mt-3 text-sm text-[rgb(var(--danger-text))]">{error}</p> : null}
    {answer?.workflowDraft ? <WorkflowDraftPreview preview={answer.workflowDraft} onModify={value => { setRequest(value.replace(/^Workflow: /,"")); input.current?.focus(); }} /> : null}
  </section>;
}
