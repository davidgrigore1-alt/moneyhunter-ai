import styles from "./DecisionFlow.module.css";

export type DecisionFlowStep = { detail: string; href?: string; action?: string; onSelect?: () => void };
/** A semantic map, never a simulated progress tracker or authority source. */
export function DecisionFlow({ steps, label = "Firul deciziei", mode = "case", compact = false }: {
  steps: readonly [DecisionFlowStep, DecisionFlowStep, DecisionFlowStep, DecisionFlowStep, DecisionFlowStep];
  label?: string;
  mode?: "case" | "definition";
  compact?: boolean;
}) {
  const labels = ["Semnal", "Dovadă / Context", "Condiție", "Pas pregătit", "Revizuire umană"];
  return <section aria-label={label} className={`${styles.flow} ${compact ? styles.compact : ""}`}>
    <div className={styles.heading}><h2>{label}</h2><p>{mode === "definition" ? "Definiție · etapele nu confirmă o rulare" : "Context → decizie · stările rămân explicite"}</p></div>
    <ol className={styles.steps}>{steps.map((step,index)=><li key={labels[index]}><span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,"0")}</span><h3>{labels[index]}</h3><p>{step.detail}</p>{step.onSelect ? <button type="button" onClick={step.onSelect} className="focus-ring mt-2 min-h-9 text-sm underline underline-offset-4">{step.action ?? "Inspectează"}</button> : step.href ? <a href={step.href} className="focus-ring">{step.action ?? "Deschide"} →</a> : null}</li>)}</ol>
  </section>;
}
