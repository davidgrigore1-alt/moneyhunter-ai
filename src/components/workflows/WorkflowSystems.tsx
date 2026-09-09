import type { WorkflowDefinition } from "@/lib/workflow-foundation";
import { workflowTriggerRegistry } from "@/lib/workflow-trigger-registry";
import { presentWorkflowAction } from "@/lib/workflow-presentation";
import { Logo } from "@/components/ui/Logo";
/** Reflects runtime effects, not the public integration catalogue. */
export function WorkflowSystems({ definition }: { definition: Pick<WorkflowDefinition,"trigger"|"actions"> }) {
  const trigger = workflowTriggerRegistry[definition.trigger];
  return <details className="border-y border-[rgb(var(--border))] px-4 py-3">
    <summary className="focus-ring cursor-pointer text-sm font-medium">Sisteme și acces · ReveNew</summary>
    <div className="mt-4 grid gap-3 text-sm">
      <Logo />
      <p><strong>Context CRM · citire</strong><br /><span className="text-[rgb(var(--text-secondary))]">Oportunitatea, responsabilul, starea, acțiunile și aprobările din același spațiu de lucru.</span></p>
      <p><strong>{trigger.label}</strong> · {trigger.automatic ? "Disponibil acum" : "Evaluare înainte de implementare"}<br /><span className="text-[rgb(var(--text-secondary))]">{trigger.explanation}</span></p>
      <ul className="divide-y divide-[rgb(var(--border))]">{definition.actions.map((action,index) => <li key={index} className="py-3"><strong>{presentWorkflowAction(action.type)}</strong><p className="mt-1 text-[rgb(var(--text-secondary))]">{action.type === "create_notification" ? "Scriere internă · notificarea poate fi creată la o rulare activată explicit. Nu trimite un mesaj extern." : "Pregătire internă · propunerea necesită confirmare înainte de aplicare."}</p></li>)}</ul>
      <p className="text-[rgb(var(--text-muted))]">Notificarea internă ajunge la responsabilul oportunității sau, dacă lipsește, la autorul workflow-ului. Revizuirea pregătită nu atribuie automat responsabilitatea.</p>
      <p className="text-[rgb(var(--text-muted))]">Acest workflow nu citește automat Gmail / Drive și nu scrie în Calendar sau CRM extern. Conectarea unui cont în Aplicații nu adaugă aceste acțiuni la workflow.</p>
      <a href="/apps" className="focus-ring w-fit py-2 underline underline-offset-4">Vezi disponibilitatea integrărilor</a>
    </div>
  </details>;
}
