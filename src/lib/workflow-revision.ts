import type { WorkflowDefinition, WorkflowCondition } from "./workflow-foundation";
/** Small, explicit edit vocabulary; never silently replaces a whole definition. */
export function reviseWorkflowDraft(definition: WorkflowDefinition, request: string) {
  const q = request.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!["draft","paused"].includes(definition.status)) return { ok: false as const, error: "Pune workflow-ul în pauză înainte de modificare." };
  if (/manager|director|aprobare.*responsabil|gmail|calendar|slack/.test(q) || (/trimite/.test(q) && !/nu trimite nimic/.test(q))) return { ok: false as const, error: "Această rutare sau acțiune externă nu este disponibilă. Definiția a rămas neschimbată." };
  let conditions = [...definition.conditions], actions = [...definition.actions];
  let matched = false;
  if (/responsabil.*exista|are responsabil|verific.*(?:responsabil|owner)/.test(q)) {
    const condition: WorkflowCondition = { field: "owner", operator: "is_not_empty", value: null };
    conditions = [...conditions.filter(item => item.field !== "owner"), condition]; matched = true;
  }
  if (/doar.*draft|numai.*draft|doar.*email|numai.*email/.test(q)) {
    actions = actions.filter(item => item.type === "prepare_email");
    if (!actions.length) return { ok: false as const, error: "Definiția nu are un pas de pregătire email. Adaugă-l explicit în editor." };
    matched = true;
  }
  if (!matched) return { ok: false as const, error: "Descrierea nu corespunde unei modificări suportate. Folosește editorul pentru condiții și pași." };
  if (conditions.length > 8) return { ok: false as const, error: "Limita de opt condiții a fost atinsă." };
  return { ok: true as const, conditions, actions };
}
