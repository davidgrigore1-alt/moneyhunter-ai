import styles from "./StageDistribution.module.css";

export function StageDistribution({ stages, total }: { stages: { label: string; count: number; value: string }[]; total: number }) {
  const maximum = Math.max(1, ...stages.map((stage) => stage.count));
  return <figure className={styles.figure} aria-label="Distribuția oportunităților după starea înregistrată">
    <figcaption><strong>{total}</strong><span>oportunități · toate monedele</span></figcaption>
    <div className={styles.axis} aria-hidden="true"><span>0</span><span>{maximum} oportunități</span></div>
    <ul>{stages.map((stage) => <li key={stage.label}>
      <div className={styles.label}><span>{stage.label}</span><strong>{stage.count} <small>· {total ? Math.round(stage.count / total * 100) : 0}%</small></strong></div>
      <div className={styles.track} aria-hidden="true"><span style={{ width: `${stage.count / maximum * 100}%` }} /></div>
    </li>)}</ul>
    <details className={styles.values}><summary className="focus-ring">Vezi valorile estimate pe stări</summary><table><caption className="sr-only">Estimări RON; monedele diferite nu sunt cumulate</caption><thead><tr><th>Stare</th><th>Cazuri</th><th>Estimare RON</th></tr></thead><tbody>{stages.map((stage) => <tr key={stage.label}><th scope="row">{stage.label}</th><td>{stage.count}</td><td>{stage.value}</td></tr>)}</tbody></table></details>
  </figure>;
}
