"use client";

import { IntelligenceDecisionBrief } from "./IntelligenceDecisionBrief";
import styles from "./OperationalIntelligence.module.css";
import { IntelligenceAnalysisStatus } from "./IntelligenceAnalysisStatus";
import { IntelligenceComparisonView } from "./IntelligenceComparisonView";
import Link from "next/link";
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, ClockIcon, DocumentTextIcon, ShieldCheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import type { CopilotAnswer, CopilotConversationTurn, CopilotPageContext, CopilotSelectionContext } from "@/lib/ai/copilot-types";
import { CommercialTruthSnapshot } from "@/components/commercial-truth/CommercialTruthSnapshot";
import { CopilotResultCards } from "@/components/intelligence/CopilotResultCards";
import { WorkflowDraftPreview } from "@/components/intelligence/WorkflowDraftPreview";
import { MultiRecordPlanView, MultiRecordResultView } from "@/components/intelligence/MultiRecordPlanning";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatProductDateTime, formatProductTime, formatUserFacingText } from "@/lib/ui/presentation";
import { applicationDateKey, applicationLocalDateTimeToIso } from "@/lib/opportunity-domain";
import { IntelligenceEvidence } from "./IntelligenceEvidence";
import { Dialog } from "@/components/ui/Modal";
import { uniqueEvidenceSources } from "@/lib/ai/intelligence-evidence";

type ConversationItem = { id: string; question: string; answer: CopilotAnswer; answeredAt: string };

function executiveHeadlineFor(answer: CopilotAnswer) {
  const truth = answer.commercialTruth?.items[0];
  const reviewedIntegrityKeys = new Set(
    (truth?.contextIntegrityPersistence?.cases ?? [])
      .filter((item) => item.state === "resolved" || item.state === "dismissed")
      .map((item) => item.findingKey)
  );
  const visibleTruthIssues =
    truth?.issues.filter(
      (item) =>
        !(
          item.origin === "context_integrity" &&
          item.integrityFindingKey &&
          reviewedIntegrityKeys.has(item.integrityFindingKey)
        )
    ) ?? [];

  if (visibleTruthIssues.some((item) => item.origin === "context_integrity")) {
    return "Contextul comercial necesită revizuire înainte de următorul pas.";
  }

  if (
    visibleTruthIssues.some((item) => item.id === "overdue-next") ||
    answer.suggestedAction?.label === "Revizuiește acțiunea restantă"
  ) {
    return "Oportunitatea necesită atenție: există o acțiune restantă.";
  }

  if (visibleTruthIssues.length) {
    return visibleTruthIssues.length === 1
      ? visibleTruthIssues[0].title
      : `${visibleTruthIssues.length} neconcordanțe necesită revizuire.`;
  }

  if (answer.answer.length > 240) {
    return answer.findings.length
      ? `${answer.findings.length} constatări necesită verificare.`
      : "Consultă concluzia și dovezile înainte de a decide.";
  }

  return answer.answer;
}

function executiveMetaFor(answer: CopilotAnswer) {
  const truth = answer.commercialTruth?.items[0];
  if (!truth) return [];

  const company = truth.claims.find(
    (claim) =>
      claim.type === "customer_identity" &&
      claim.derivation === "structured_record"
  );
  const owner = truth.claims.find((claim) => claim.type === "owner");
  const due = truth.claims.find((claim) => claim.type === "next_step_due_at");

  return [
    company?.value ? `Context · ${company.value}` : null,
    owner?.value ? `Responsabil · ${owner.value}` : null,
    due?.value ? `Termen · ${due.value}` : null
  ].filter((value): value is string => Boolean(value));
}

function visibleFindingsFor(answer: CopilotAnswer) {
  const findings = answer.findings ?? [];
  if (
    findings.length === 1 &&
    findings[0]?.label.trim().toLocaleLowerCase("ro-RO") ===
      "oportunitate înregistrată" &&
    Boolean(answer.suggestedAction)
  ) {
    return [];
  }
  return findings;
}
export function contextForPath(pathname: string, lockedContext?: Partial<CopilotPageContext>, contextLabel?: string): CopilotPageContext {
  const companyMatch = pathname.match(/^\/crm\/organizations\/([0-9a-z-]+)/i);
  const opportunityMatch = pathname.match(/^\/opportunities\/([0-9a-z-]+)/i);
  const contactMatch = pathname.match(/^\/crm\/contacts\/([0-9a-z-]+)/i);
  const pageType = lockedContext?.pageType ?? (companyMatch ? "company" : opportunityMatch ? "opportunity" : pathname === "/dashboard" ? "dashboard" : pathname === "/ai" ? "ai" : "other");
  return {
    route: lockedContext?.route ?? pathname,
    pageType,
    ...(lockedContext?.documentSourceId ? { documentSourceId: lockedContext.documentSourceId, documentVersionId: lockedContext.documentVersionId } : {}),
    ...(lockedContext?.organizationId ?? companyMatch?.[1] ? { organizationId: lockedContext?.organizationId ?? companyMatch?.[1] } : {}),
    ...(lockedContext?.opportunityId ?? opportunityMatch?.[1] ? { opportunityId: lockedContext?.opportunityId ?? opportunityMatch?.[1] } : {}),
    ...(lockedContext?.selectedRecordId ? { selectedRecordId: lockedContext.selectedRecordId } : {}),
    ...(lockedContext?.contactId ?? contactMatch?.[1] ? { contactId: lockedContext?.contactId ?? contactMatch?.[1] } : {}),
    ...((contextLabel ?? (contactMatch ? "Contactul curent" : pathname === "/inbox" ? lockedContext?.selectedRecordId ? "Emailul selectat · context privat" : "Inbox Comercial · context privat" : undefined)) ? { contextLabel: contextLabel ?? (contactMatch ? "Contactul curent" : lockedContext?.selectedRecordId ? "Emailul selectat · context privat" : "Inbox Comercial · context privat") } : {})
  };
}

export function suggestionsFor(context: CopilotPageContext) {
  if (context.contactId) return ["Care este ultima interacțiune relevantă?", "Ce oportunități sunt asociate?", "Există ceva care necesită răspuns?"];
  if (context.route === "/inbox") return context.selectedRecordId ? ["Rezumă conversația.", "De ce contează comercial?", "Există o oportunitate asociată?", "Pregătește un răspuns."] : ["Ce emailuri recente contează?", "Ce conversații sunt legate de oportunități?"];
  if (context.pageType === "company") return ["Ce se întâmplă cu această companie?", "Ce oportunități necesită atenție?", "Ce conversații recente contează?", "Ce trebuie făcut mai departe?"];
  if (context.pageType === "opportunity") return ["Ce blochează această oportunitate?", "Ce s-a schimbat recent?", "Care este următorul pas sigur?", "Pregătește următorul pas."];
  if (context.pageType === "dashboard" || context.pageType === "ai") return ["Ce necesită atenție astăzi?", "Ce s-a schimbat recent?", "Ce oportunități nu au următor pas?", "Unde avem valoare expusă?"];
  return ["Arată-mi top 5 oportunități după valoare.", "Ce follow-up-uri sunt restante?", "Ce oportunități nu au următor pas?", "Ce s-a schimbat recent?", "Explică această pagină."];
}

export function PreparedActionCard({ action, approvalEndpoint, approvalContext, completionHref, provenance }: { action: NonNullable<CopilotAnswer["preparedAction"]>; approvalEndpoint?: string; approvalContext?: Record<string, string>; completionHref?: string; provenance?: { label: string; href: string } }) {
  const router = useRouter();
  const initial = action.proposal ?? {};
  const [subject, setSubject] = useState(action.subject ?? "");
  const [body, setBody] = useState(action.body ?? "");
  const [dueAt, setDueAt] = useState(typeof initial.dueAt === "string" && Number.isFinite(Date.parse(initial.dueAt)) ? `${applicationDateKey(new Date(initial.dueAt))}T${formatProductTime(initial.dueAt)}` : "");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"" | "success" | "replay">("");
  const [actionError, setActionError] = useState("");

  async function approve() {
    if (!action.planId || submitting || result) return;
    setSubmitting(true); setActionError("");
    const proposal: Record<string, unknown> = { ...initial };
    if (action.actionType === "create_task" || action.actionType === "update_next_action") {
      const [date, time] = dueAt.split("T");
      const instant = dueAt ? applicationLocalDateTimeToIso(date, time) : null;
      if ((approvalContext && !instant) || (dueAt && (!instant || Date.parse(instant) <= Date.now()))) { setActionError("Alege un termen viitor în fusul orar al produsului."); setSubmitting(false); return; }
      proposal.title = subject; proposal.description = body; proposal.dueAt = instant;
    }
    else if (action.actionType === "add_note") proposal.note = body;
    else if (action.actionType === "prepare_email") { proposal.subject = subject; proposal.body = body; }
    try {
      const response = await fetch(approvalEndpoint ?? `/api/ai/action-plans/${action.planId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...approvalContext, planId: action.planId, proposal }) });
      const payload = await response.json() as { ok?: boolean; replay?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Acțiunea nu a putut fi aplicată.");
      setResult(payload.replay ? "replay" : "success");
      router.refresh();
    } catch (error) { setActionError(error instanceof Error ? error.message : "Acțiunea nu a putut fi aplicată."); }
    finally { setSubmitting(false); }
  }

  const editableText = action.actionType === "create_task" || action.actionType === "update_next_action" || action.actionType === "add_note" || action.type === "email_draft";
  return (
    <section className="mt-5 overflow-hidden rounded-panel border border-[rgb(var(--primary-border))] bg-[rgb(var(--surface-elevated))]" aria-label={action.title}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-[rgb(var(--intelligence-tint))] text-[rgb(var(--intelligence-strong))] dark:text-[rgb(var(--intelligence))]"><DocumentTextIcon className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--intelligence-strong))] dark:text-[rgb(var(--intelligence))]">Acțiune pregătită</p><h4 className="mt-1 text-sm font-semibold text-[rgb(var(--foreground))]">{action.title}</h4><p className="mt-0.5 truncate text-xs text-[rgb(var(--text-secondary))]">{action.target?.label ?? "Context autorizat"}</p></div></div>
        <span className="status-pill status-pill-warning">{action.riskLevel === "external" ? "Efect extern" : action.riskLevel === "review" ? "Necesită revizuire" : "Risc redus"}</span>
      </header>
      {provenance ? <Link href={provenance.href} className="focus-ring mx-4 mt-3 block text-xs text-[rgb(var(--text-secondary))]">Generat de workflow · {provenance.label} →</Link> : null}
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="grid gap-3">
          {(action.actionType === "create_task" || action.actionType === "update_next_action" || action.type === "email_draft") ? <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">{action.type === "email_draft" ? "Subiect" : "Titlu"}<input value={subject} onChange={(event) => setSubject(event.target.value.slice(0, 500))} disabled={Boolean(result)} className="focus-ring min-h-9 rounded-control border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm font-normal" /></label> : null}
          {editableText ? <label className="grid gap-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">{action.actionType === "add_note" ? "Notă" : action.type === "email_draft" ? "Mesaj" : "Context"}<textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, action.type === "email_draft" ? 100000 : 5000))} disabled={Boolean(result)} rows={action.type === "email_draft" ? 7 : 4} className="focus-ring resize-y rounded-control border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm font-normal leading-5" /></label> : <p className="whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-secondary))]">{body || subject}</p>}
          {(action.actionType === "create_task" || action.actionType === "update_next_action") ? <label className="grid max-w-xs gap-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">Termen propus · confirmă sau modifică<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} disabled={Boolean(result)} className="focus-ring min-h-9 rounded-control border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm font-normal" /><span className="font-normal text-[rgb(var(--text-secondary))]">Ora București · pas nou, nu termenul istoric</span></label> : null}
          <p className="text-xs leading-5 text-[rgb(var(--text-secondary))]">{action.rationale}</p>
        </div>
        <aside className="border-t border-[rgb(var(--border))] pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0"><p className="flex items-center gap-1.5 text-xs font-semibold"><ShieldCheckIcon className="h-4 w-4 text-[rgb(var(--primary))]" aria-hidden="true" />Control înainte de aplicare</p><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{action.executionNotice}</p><p className="mt-3 text-xs text-[rgb(var(--text-secondary))]">Se modifică doar înregistrarea indicată. Accesul extern și celelalte câmpuri rămân neschimbate.</p></aside>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
        <p className="text-xs text-[rgb(var(--text-secondary))]">{result ? (result === "replay" ? "Acțiunea era deja aplicată. Nu a fost executată din nou." : "Acțiune aplicată și înregistrată în audit.") : action.ownerResolutionRequired ? "Responsabilul trebuie selectat explicit înainte de aprobare." : "Pregătit · neexecutat · editabil"}</p>
        {action.planId ? <Button type="button" size="small" loading={submitting} disabled={Boolean(result) || action.ownerResolutionRequired} onClick={() => void approve()}>{result ? "Aplicat" : "Aprobă și aplică"}</Button> : null}
        {result && completionHref ? <Link href={completionHref} className="focus-ring rounded text-xs font-semibold text-[rgb(var(--primary))]">{action.actionType === "prepare_email" ? "Deschide conversația și draftul" : "Deschide oportunitatea"} →</Link> : null}
        {actionError ? <p className="w-full text-xs text-[rgb(var(--danger-text))]" role="alert">{actionError}</p> : null}
      </footer>
    </section>
  );
}
export function CopilotConversation({ className, lockedContext, contextLabel, autoFocus = false, initialSuggestions, initialQuestion = "" }: { className?: string; lockedContext?: Partial<CopilotPageContext>; contextLabel?: string; autoFocus?: boolean; initialSuggestions?: string[]; initialQuestion?: string }) {
  const pathname = usePathname();

  const inputId = useId();
  const pageContext = useMemo(() => contextForPath(pathname, lockedContext, contextLabel), [contextLabel, lockedContext, pathname]);
  const [scope,setScope]=useState<"current"|"workspace">("current");
  const [prepareReview,setPrepareReview]=useState<string | null>(null);
  const abortRef=useRef<AbortController | null>(null);
  const context:CopilotPageContext=scope==="workspace"?{route:"/ai",pageType:"ai",contextLabel:pageContext.documentSourceId?"Versiune + CRM autorizat":"Workspace autorizat",...(pageContext.documentSourceId?{documentSourceId:pageContext.documentSourceId,documentVersionId:pageContext.documentVersionId,documentComparisonScope:"workspace" as const}:{})}:pageContext;
  const suggestions = initialSuggestions ?? suggestionsFor(context);
  const contextIdentity = JSON.stringify(pageContext);
  const [question, setQuestion] = useState(initialQuestion.slice(0, 3000));
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<CopilotSelectionContext | undefined>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setScope("current"); setConversation([]); setSelection(undefined); setPrepareReview(null); setLoading(false);
    return () => { abortRef.current?.abort(); abortRef.current = null; };
  }, [contextIdentity]);


  useEffect(() => {
    if (autoFocus) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [autoFocus]);

  async function ask(value: string, prepare = false, candidateSelectionId?: string) {
    const normalized = value.trim();
    if (normalized.length < 2 || loading || abortRef.current) return;
    setQuestion(normalized);
    setLoading(true);
    setError("");
    const controller = new AbortController(); abortRef.current = controller;
    setPrepareReview(null);
    const history: CopilotConversationTurn[] = conversation.slice(0, 4).reverse().flatMap((item) => [{ role: "user" as const, content: item.question }, { role: "assistant" as const, content: item.answer.answer }]);
    try {
      const response = await fetch("/api/ai/copilot", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ question: normalized, context, history, ...(!prepare && conversation[0]?.answer.analysisToken ? {analysisToken:conversation[0].answer.analysisToken} : {}), ...(candidateSelectionId ? {candidateSelectionId} : {}), preparationIntent: !context.documentSourceId && prepare, ...(selection ? { selection } : {}) }) });
      const payload = await response.json() as CopilotAnswer | { error?: string };
      if (controller.signal.aborted || abortRef.current !== controller) return;
      if (!response.ok || !("answer" in payload)) throw new Error("Nu am putut finaliza verificarea. Datele și acțiunile existente au rămas neschimbate.");
      if (payload.multiRecordResult) setSelection({ resultSetId: payload.multiRecordResult.resultSetId, selectedRecordIds: [] });
      setConversation((current) => [{ id: `${Date.now()}-${current.length}`, question: normalized, answer: payload, answeredAt: new Date().toISOString() }, ...current].slice(0, 8));
      setQuestion("");
      setComposerExpanded(false);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setError(requestError instanceof Error && requestError.message ? requestError.message : "Nu am putut finaliza verificarea. Datele și acțiunile existente au rămas neschimbate.");
    } finally {
      if (abortRef.current === controller) { abortRef.current = null; setLoading(false); }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  const previousCount = loading ? conversation.length : Math.max(0, conversation.length - 1);
  return (
    <div className={cn("grid min-h-0 min-w-0 gap-4", styles.conversationRoot, className)}>
      {conversation.length > 0 && !loading && !composerExpanded ? null : <form onSubmit={submit} className={cn("product-work-surface grid gap-3 p-4 sm:p-6", styles.composer)}>
        <div className={styles.context}>
          <p><ShieldCheckIcon aria-hidden="true" />Context autorizat · {context.contextLabel ?? (context.pageType === "opportunity" ? "Oportunitatea curentă" : context.pageType === "company" ? "Compania curentă" : context.pageType === "dashboard" ? "Control Center" : "Întregul spațiu de lucru")}</p>
          <span className="sr-only">Enter pentru analiză · Shift+Enter pentru rând nou</span>
        </div>
        {pageContext.opportunityId||pageContext.organizationId||pageContext.contactId||pageContext.documentSourceId?<div role="group" aria-label="Contextul verificării" className={styles.scopeControl}>
         {(["current","workspace"] as const).map(value=><button key={value} type="button" disabled={loading} aria-pressed={scope===value} onClick={()=>{setScope(value);setConversation([]);setSelection(undefined);setPrepareReview(null);}} className={cn("focus-ring", styles.scopeOption)}>{value==="current"?(pageContext.documentSourceId?"Această versiune":pageContext.contactId?"Contactul selectat":pageContext.opportunityId?"Această oportunitate":"Compania selectată"):pageContext.documentSourceId?"Versiune + CRM autorizat":"Workspace autorizat"}</button>)}
        </div>:null}
        <label htmlFor={inputId} className={styles.inputLabel}>Întrebarea ta</label>
        {pageContext.documentSourceId ? <p className="px-2 text-xs text-[rgb(var(--text-secondary))]">{pageContext.documentSourceId ? `Pornit din ${pageContext.contextLabel ?? "document"} · versiunea ${pageContext.documentVersionId?.slice(0,8)}. ` : ""}Analiza este numai pentru citire.</p> : null}
        <textarea ref={inputRef} data-copilot-input id={inputId} aria-describedby={`${inputId}-trust`} aria-keyshortcuts="Enter" value={question} onChange={(event) => { setQuestion(event.target.value.slice(0, 3000)); setPrepareReview(null); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void ask(question); } }} rows={3} maxLength={3000} placeholder="Exemplu: Ce necesită atenție astăzi și pe ce dovezi se bazează?" className={cn("focus-ring resize-none", styles.questionInput)} />
        <div className={styles.composerFooter}><p id={`${inputId}-trust`} className={styles.trustLine}><ShieldCheckIcon aria-hidden="true" /><span className={styles.trustText}>Doar date autorizate · fără execuție externă.</span></p><div className={styles.composerActions}>{loading ? <IntelligenceAnalysisStatus /> : <Button type="submit" size="small" className={styles.analyzeButton} variant="intelligence" disabled={question.trim().length < 2}>Analizează contextul<ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Button>}{loading ? <Button type="button" variant="secondary" className={styles.cancelButton} onClick={()=>{abortRef.current?.abort(); abortRef.current=null; setLoading(false); inputRef.current?.focus();}}>Anulează</Button> : context.opportunityId && question.trim().length >= 2 ? <Button type="button" variant="secondary" size="small" className={styles.prepareButton} onClick={()=>setPrepareReview(question)}>Pregătește propunerea descrisă</Button> : null}</div></div>
      </form>}

      {prepareReview ? <Dialog labelledBy={`${inputId}-prepare-title`} onClose={()=>setPrepareReview(null)}><div className="p-5"><h2 id={`${inputId}-prepare-title`} className="text-lg font-semibold">Revizuiește cererea de pregătire</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{prepareReview}</p><p className="mt-3 text-xs leading-5 text-[rgb(var(--text-secondary))]">Context: {context.contextLabel ?? "Oportunitatea curentă"}. Cererea salvează o propunere dacă ai permisiunea necesară. Aplicarea se aprobă separat.</p><div className="mt-5 flex gap-2"><Button type="button" onClick={()=>void ask(prepareReview,true)}>Confirmă pregătirea</Button><Button type="button" variant="secondary" onClick={()=>setPrepareReview(null)}>Înapoi</Button></div></div></Dialog> : null}
      <div className="grid gap-5" aria-live="polite" aria-busy={loading}>
        {conversation.length > 0 ? (
          <div className={styles.responseToolbar}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-secondary))]">{loading ? "Răspuns în pregătire" : "Răspuns activ"}</p>
            {!loading && !composerExpanded ? <button type="button" className={cn("focus-ring", styles.askAgain)} onClick={() => { setComposerExpanded(true); window.setTimeout(() => inputRef.current?.focus(), 0); }}><span>Întreabă din nou</span><ArrowRightIcon aria-hidden="true" /></button> : null}
            <details className={styles.responseMenu}>
              <summary className="focus-ring" aria-label="Mai multe opțiuni"><span aria-hidden="true">•••</span></summary>
              <div className={styles.responseMenuPanel}>
                {previousCount > 0 ? <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((value) => !value)}><ClockIcon aria-hidden="true" />{historyOpen ? "Ascunde istoricul" : `Istoric · ${previousCount}`}</button> : null}
                <button type="button" disabled={loading} onClick={() => { setConversation([]); setHistoryOpen(false); setSelection(undefined); }}><TrashIcon aria-hidden="true" />Șterge conversația</button>
              </div>
            </details>
          </div>
        ) : null}
        {conversation.length === 0 && !loading ? (
          <section aria-labelledby={`${inputId}-suggestions`}>
            <h3 id={`${inputId}-suggestions`} className={styles.promptHeading}>Începe cu o întrebare relevantă</h3>
            <div className={styles.suggestionList}>
              {suggestions.slice(0, 3).map((suggestion) => <button key={suggestion} type="button" disabled={loading} className={cn("focus-ring group", styles.suggestion)} onClick={() => void ask(suggestion)}><span className={styles.suggestionLabel} title={suggestion}>{suggestion}</span><ArrowRightIcon className={styles.suggestionArrow} aria-hidden="true" /></button>)}
            </div>
          </section>
        ) : conversation.map((item, index) => (
          <article key={item.id} className={cn("intelligence-reveal overflow-hidden rounded-panel border", styles.answer, index === 0 && !loading ? cn(styles.answerActive, "border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))]") : historyOpen ? "border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))]" : "hidden")} aria-labelledby={`${item.id}-answer`}>
            <div className={styles.answerShell}>
            <div className={styles.questionEcho}>
              <div className="min-w-0"><p className={styles.questionEyebrow}>Întrebarea ta</p><p className={styles.questionText}>{item.question}</p></div>
              <button type="button" onClick={() => setConversation((current) => current.filter((turn) => turn.id !== item.id))} className={cn("focus-ring", styles.answerDismiss)} aria-label="Elimină acest răspuns"><XMarkIcon className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <div className={styles.answerContent}>
              <div className={styles.executive}><div className={styles.answerMeta}>
                <h4>{item.answer.productHelp ? "Ajutor ReveNew" : "ReveNew · Context → decizie"}</h4>
                <span className={styles.answerMode}>
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-[rgb(var(--intelligence-strong))] dark:text-[rgb(var(--intelligence))]" aria-hidden="true" />
                  {item.answer.clarification ? "Clarificare necesară" : item.answer.mode === "ai" ? "Sinteză cu model" : item.answer.summaryType === "product_help" ? "Context produs" : item.answer.summaryType === "insufficient_information" ? "Limită de date explicită" : "Mod limitat · date și calcule"}
                  {item.answer.evidence.length ? ` · ${uniqueEvidenceSources(item.answer.evidence)} ${uniqueEvidenceSources(item.answer.evidence) === 1 ? "sursă" : "surse"}` : ""}
                </span>
              </div>
              {!item.answer.productHelp ? <p className={styles.answerTime}>{formatProductDateTime(item.answeredAt)} · Instantaneu; reverifică după modificări.</p> : null}
              <p id={`${item.id}-answer`} className={styles.conclusion}>{formatUserFacingText(executiveHeadlineFor(item.answer))}</p>{executiveMetaFor(item.answer).length ? <div className={styles.executiveMeta}>{executiveMetaFor(item.answer).map(value => <span key={value}>{value}</span>)}</div> : null}</div>
              {item.answer.productHelp ? <ol className="mt-5 grid list-decimal gap-3 pl-5 text-sm leading-6">{item.answer.productHelp.steps.map(step => <li key={step}>{step}</li>)}</ol> : null}
              {item.answer.answer.length > 320 ? <details className={styles.fullAnswer}><summary className="focus-ring">Răspuns complet</summary><p className={styles.fullAnswerText}>{formatUserFacingText(item.answer.answer)}</p></details> : null}
              <IntelligenceComparisonView answer={item.answer} disabled={loading||index!==0} onSelect={id=>void ask("Compară înregistrarea selectată cu sursa.",false,id)} />
              {item.answer.commercialTruth?<div className="mt-4 space-y-3">{item.answer.commercialTruth.items.map(truth=><CommercialTruthSnapshot key={truth.opportunityId} truth={truth} compact prepareLabel={context.opportunityId===truth.opportunityId?"Pregătește următorul pas":"Deschide oportunitatea"} onPrepare={()=>{if(context.opportunityId===truth.opportunityId)setPrepareReview("Pregătește următorul pas.");else window.location.assign("/opportunities/"+truth.opportunityId);}}/>)}</div>:null}
              {item.answer.workflowDraft ? <WorkflowDraftPreview preview={item.answer.workflowDraft} onModify={(request) => { setComposerExpanded(true); setQuestion(request); window.setTimeout(() => inputRef.current?.focus(), 0); }} /> : null}
              {item.answer.multiRecordResult ? <MultiRecordResultView result={item.answer.multiRecordResult} onSelectionChange={(resultSetId, selectedRecordIds) => setSelection({ resultSetId, selectedRecordIds })} onAsk={(nextQuestion) => void ask(nextQuestion)} /> : null}
              {item.answer.multiRecordPlan ? <MultiRecordPlanView preview={item.answer.multiRecordPlan} /> : null}
              {item.answer.decisionCases?.length ? <IntelligenceDecisionBrief answer={item.answer} /> : null}
              {item.answer.presentation?.kind === "interventions" ? <><IntelligenceDecisionBrief answer={item.answer} /><details className="mt-4 border-t border-[rgb(var(--border))] pt-3"><summary className={cn("focus-ring py-3 text-xs font-medium", styles.disclosure)}>Pregătire și opțiuni pentru aceste cazuri</summary><CopilotResultCards presentation={item.answer.presentation} onAsk={(nextQuestion) => void ask(nextQuestion)} /></details></> : item.answer.presentation ? <CopilotResultCards presentation={item.answer.presentation} onAsk={(nextQuestion) => void ask(nextQuestion)} /> : null}
              {!item.answer.workflowDraft && !item.answer.multiRecordResult && !item.answer.multiRecordPlan && !item.answer.presentation && !item.answer.decisionCases?.length && visibleFindingsFor(item.answer).length > 0 ? (
                <section className={styles.findingsSection} aria-label="Puncte relevante">
                  <h4 className={styles.sectionEyebrow}>Puncte relevante</h4>
                  <ul className={styles.findingsList}>
                    {visibleFindingsFor(item.answer).slice(0, 4).map((finding, findingIndex) => <li key={`${finding.label}-${findingIndex}`} className={styles.findingRow}><p className={styles.findingTitle}>{finding.label}</p><p className={styles.findingDetail}>{formatUserFacingText(finding.detail)}</p><p className={styles.findingSourceLabel}>{finding.kind === "derived" ? "Interpretare prudentă" : "Date din surse"}</p><IntelligenceEvidence inline answer={{...item.answer,evidence:item.answer.evidence.filter(e=>finding.sourceIds.includes(e.sourceId)),checkedSources:[]}} /></li>)}
                  </ul>
                </section>
              ) : null}
              {!item.answer.workflowDraft && item.answer.preparedAction ? <PreparedActionCard action={item.answer.preparedAction} /> : null}
              {!item.answer.workflowDraft && !item.answer.productHelp && !item.answer.decisionCases?.length && item.answer.presentation?.kind !== "interventions" ? <IntelligenceEvidence answer={item.answer} /> : null}
              {!item.answer.workflowDraft && item.answer.missingInformation.length > 0 ? <section className={styles.limitations}><h4 className="text-xs font-semibold text-[rgb(var(--warning-text))]">Informații lipsă sau neconfirmate</h4><ul className="mt-1 grid gap-1 text-xs leading-5 text-[rgb(var(--text-secondary))]">{item.answer.missingInformation.map((missing) => <li key={missing}>— {formatUserFacingText(missing)}</li>)}</ul></section> : null}
              {!item.answer.workflowDraft && item.answer.caveats.length > 0 ? <details className={styles.caveats}><summary className="focus-ring cursor-pointer py-2">Acoperire și limite</summary><p>{formatUserFacingText(item.answer.caveats.join(" "))}</p></details> : null}
              {!item.answer.commercialTruth && !item.answer.workflowDraft && !item.answer.decisionCases?.length && item.answer.presentation?.kind !== "interventions" && item.answer.suggestedAction ? <div className="mt-4"><Button href={item.answer.suggestedAction.route} size="small" className={styles.answerPrimary}>{item.answer.suggestedAction.label}<ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Button></div> : null}
              {!item.answer.workflowDraft && item.answer.followUps.length > 0 ? <div className={styles.followUpSection}><p className={styles.sectionEyebrow}>Continuă analiza</p><div className={styles.followUpList}>{item.answer.followUps.slice(0, 2).map((followUp) => <button key={followUp} type="button" disabled={loading} className={cn("focus-ring disabled:cursor-not-allowed disabled:opacity-60", styles.followUpAction)} onClick={() => void ask(followUp)}><span className={styles.followUpLabel} title={followUp}>{followUp}</span><ArrowRightIcon className={styles.followUpArrow} aria-hidden="true" /></button>)}</div></div> : null}
            </div>
            </div>
          </article>
        ))}
        {error ? <div className="rounded-control border border-[rgb(var(--danger-border))] bg-[rgb(var(--danger-background))] p-3" role="alert"><p className="text-sm text-[rgb(var(--danger-text))]">{error}</p><button type="button" className="focus-ring mt-2 rounded-button text-xs font-semibold underline" onClick={() => void ask(question)}>Reîncearcă</button></div> : null}
      </div>
    </div>
  );
}
