import type { ExecutionControlCenterModel } from "@/lib/execution-control-center";
import { formatProductCurrency } from "@/lib/ui/presentation";
import styles from "./ExecutiveSnapshot.module.css";

/** A projection of the same authorized cases shown immediately below. No forecast or new score. */
export function ExecutiveSnapshot({ model }: { model: ExecutionControlCenterModel }) {
  const total = model.cases.length;
  const unassigned = model.cases.filter((item) => !item.owner.id).length;
  const critical = model.cases.filter((item) => item.severity === "critical").length;
  const attention = model.cases.filter((item) => item.severity === "attention").length;
  const currencies = Object.entries(model.exposure);
  const groups = [
    { label: "Critică", count: critical, tone: styles.critical },
    { label: "De verificat", count: attention, tone: styles.attention },
    { label: "De urmărit", count: total - critical - attention, tone: styles.neutral },
  ];
  return <section className={styles.snapshot} aria-label="Sinteză executivă">
    <div className={styles.heading}><p>Sinteză executivă</p><a className="focus-ring" href="#execution-queue-title">Mergi la cazuri <span aria-hidden="true">↗</span></a></div>
    <dl className={styles.metrics}>
      <div><dt>Cazuri în atenție</dt><dd>{total}</dd></div>
      <div><dt>Cazuri cu termen depășit</dt><dd>{model.overdueCount}</dd></div>
      <div><dt>Fără responsabil</dt><dd>{unassigned}</dd></div>
      <div><dt>Expunere estimată</dt><dd className={styles.money}>{currencies.length ? currencies.map(([currency, amount]) => <span key={currency}>{formatProductCurrency(amount, currency)}</span>) : "Fără valori"}</dd></div>
    </dl>
    <div className={styles.summary}>
      <figure><figcaption>Prioritatea cazurilor <span>{total} în coadă</span></figcaption>
        <div className={styles.stack} aria-hidden="true">{groups.map((group) => <span key={group.label} className={group.tone} style={{ width: `${total ? group.count / total * 100 : 0}%` }} />)}</div>
        <ul className={styles.legend}>{groups.map((group) => <li key={group.label}><i className={group.tone} aria-hidden="true" />{group.label} <strong>{group.count}</strong></li>)}</ul>
      </figure>
      <figure><figcaption>Responsabilitate <span>{total - unassigned} / {total} atribuite</span></figcaption>
        <div className={styles.stack} aria-hidden="true"><span className={styles.assigned} style={{ width: `${total ? (total - unassigned) / total * 100 : 0}%` }} /></div>
        <p className={styles.note}>{unassigned ? `${unassigned} cazuri au nevoie de un responsabil.` : total ? "Fiecare caz are un responsabil atribuit." : "Cazurile vor apărea după înregistrarea contextului comercial."} Monedele sunt păstrate separat.</p>
      </figure>
    </div>
  </section>;
}
