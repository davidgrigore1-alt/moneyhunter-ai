import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { CopilotAnswer } from "@/lib/ai/copilot-types";
import { formatProductCurrency, formatProductDateTime } from "@/lib/ui/presentation";
import { IntelligenceEvidence } from "./IntelligenceEvidence";
import styles from "./OperationalIntelligence.module.css";

/** The case fields are a server projection, never inferred from model prose. */
export function IntelligenceDecisionBrief({ answer }: { answer: CopilotAnswer }) {
  const cases = answer.decisionCases ?? answer.presentation?.interventions ?? [];
  if (!cases.length) return null;
  return <section className={styles.brief} aria-label="Cazuri pentru decizie">
    <div className={styles.briefHeading}><h3>Cazuri pentru decizie</h3><span>{cases.length} în selecția analizată</span></div>
    <ol>{cases.map((item, index) => {
      const evidence = answer.evidence.filter(source => source.sourceId === `intervention:${item.id}` || source.recordId === item.opportunityId || source.route?.split("?")[0] === `/opportunities/${item.opportunityId}`);
      const timing = item.reasons.find(reason => reason.at);
      return <li key={item.id} className={styles.case}>
        <header><span className={styles.caseNumber}>{String(index + 1).padStart(2, "0")}</span><div><h4>{item.company}</h4><p>{item.title}</p></div>{item.estimatedExposure !== null ? <div className={styles.caseValue}>{formatProductCurrency(item.estimatedExposure, item.currency)}<small>Expunere estimată</small></div> : null}</header>
        <p className={styles.caseSignal}>{item.summary}</p>
        <dl className={styles.caseFacts}>
          <div><dt>De ce acum</dt><dd>{timing ? `${timing.label} · ${formatProductDateTime(timing.at!)}` : item.reasons[0]?.label || "Termen neconfirmat"}</dd></div>
          <div><dt>Responsabil</dt><dd>{item.owner || "Neconfirmat"}</dd></div>
          <div><dt>Termen comercial</dt><dd>{item.deadline ? formatProductDateTime(item.deadline) : "Neconfirmat"}</dd></div>
          <div><dt>Dovadă</dt><dd>{evidence.length ? `${evidence.length} ${evidence.length === 1 ? "înregistrare citată" : "înregistrări citate"}` : "Nicio dovadă citată în această selecție"}</dd></div>
        </dl>
        <div className={styles.caseNext}><div><span>Pas recomandat · de revizuit</span><p>{item.recommendation}</p></div><Link className={`focus-ring ${styles.followUp}`} href={item.reviewHref || `/opportunities/${item.opportunityId}`}>Deschide cazul<ArrowRightIcon width={16} aria-hidden="true" /></Link></div>
        {evidence.length ? <IntelligenceEvidence answer={{ ...answer, evidence, checkedSources: [] }} /> : null}
      </li>;
    })}</ol>
  </section>;
}
