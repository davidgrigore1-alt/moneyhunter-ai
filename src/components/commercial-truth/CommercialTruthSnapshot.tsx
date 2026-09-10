"use client";

import Link from "next/link";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { Button } from "@/components/ui/Button";
import {
  truthStateLabels,
  type CommercialTruth
} from "@/lib/commercial-truth";
import { formatProductDateTime } from "@/lib/ui/presentation";
import { ContextIntegrityStrip } from "./ContextIntegrityStrip";
import styles from "./CommercialTruthSnapshot.module.css";

export function CommercialTruthSnapshot({
  truth,
  onPrepare,
  compact = false,
  showFacts = true,
  prepareLabel = "Pregătește următorul pas"
}: {
  truth: CommercialTruth | null;
  onPrepare?: () => void;
  compact?: boolean;
  showFacts?: boolean;
  prepareLabel?: string;
}) {
  if (!truth) {
    return (
      <p className={styles.unavailable}>
        Situație comercială · Informație insuficientă momentan. Oportunitatea rămâne disponibilă.
      </p>
    );
  }

  const reviewedIntegrityKeys = new Set(
    (truth.contextIntegrityPersistence?.cases ?? [])
      .filter((item) => item.state === "resolved" || item.state === "dismissed")
      .map((item) => item.findingKey)
  );

  const visibleIssues = truth.issues.filter(
    (item) =>
      !(
        item.origin === "context_integrity" &&
        item.integrityFindingKey &&
        reviewedIntegrityKeys.has(item.integrityFindingKey)
      )
  );

  const discrepancies = visibleIssues.filter(
    (item) => item.kind === "interpretation"
  ).length;
  const integrityCount = truth.contextIntegrity?.findings.length ?? 0;
  const hasReviewedCurrentIntegrity =
    integrityCount > 0 &&
    truth.issues.some(
      (item) =>
        item.origin === "context_integrity" &&
        Boolean(item.integrityFindingKey) &&
        reviewedIntegrityKeys.has(item.integrityFindingKey!)
    );

  const displayStateLabel =
    !visibleIssues.length && hasReviewedCurrentIntegrity
      ? "Decizie consemnată"
      : truthStateLabels[truth.state];

  const visibleFacts = truth.topFacts.slice(0, 4);
  const primaryIssues = visibleIssues.slice(0, 2);

  return (
    <section
      aria-label="Situație comercială verificabilă"
      className={styles.root}
    >
      <div className={styles.header}>
        <h3>
          {compact ? (
            <Link
              href={`/opportunities/${truth.opportunityId}`}
              className="focus-ring"
            >
              {truth.title}
            </Link>
          ) : (
            "Situație comercială"
          )}
        </h3>
        <span>
          {discrepancies
            ? `${discrepancies} ${
                discrepancies === 1 ? "neconcordanță" : "neconcordanțe"
              }`
            : displayStateLabel}
        </span>
      </div>

      {integrityCount ? <ContextIntegrityStrip truth={truth} /> : null}

      {showFacts && visibleFacts.length ? (
        <dl className={styles.metrics} aria-label="Repere comerciale">
          {visibleFacts.map((fact) => (
            <div key={fact.id} className={styles.metric}>
              <dt>{fact.label}</dt>
              <dd title={fact.value}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <details className={styles.whyDetails}>
        <summary className="focus-ring">
          De ce? · Dovezi și următorul pas
        </summary>

        <div className={styles.whyBody}>
          {primaryIssues.length ? (
            <div className={styles.issueList}>
              {primaryIssues.map((item) => (
                <article key={item.id} className={styles.issue}>
                  <p className={styles.issueType}>
                    {item.origin === "context_integrity"
                      ? "Integritatea contextului"
                      : item.kind === "interpretation"
                        ? "Necesită verificare"
                        : "Context incomplet"}
                  </p>
                  <h4>{item.title}</h4>

                  <div className={styles.decisionGrid}>
                    <div>
                      <p className={styles.decisionLabel}>De ce contează</p>
                      <p className={styles.decisionValue}>{item.whyItMatters}</p>
                    </div>
                    <div>
                      <p className={styles.decisionLabel}>Ce faci acum</p>
                      <p className={styles.decisionValue}>{item.nextStep}</p>
                    </div>
                  </div>

                  <details className={styles.issueEvidence}>
                    <summary className="focus-ring">
                      Context și dovezi
                    </summary>
                    <p className={styles.explanation}>{item.explanation}</p>
                    <ul className={styles.factList}>
                      {truth.claims
                        .filter((fact) => item.claimIds.includes(fact.id))
                        .map((fact) => (
                          <li key={fact.id}>
                            <strong>{fact.label}</strong>
                            <span>
                              {fact.value}
                              {fact.freshness !== "current"
                                ? " · actualitate neconfirmată"
                                : ""}
                            </span>
                          </li>
                        ))}
                    </ul>
                    <EvidenceList items={item.evidence} />
                  </details>
                </article>
              ))}
              {visibleIssues.length > primaryIssues.length ? (
                <p className={styles.moreIssues}>
                  + {visibleIssues.length - primaryIssues.length} constatări suplimentare în contextul complet.
                </p>
              ) : null}
            </div>
          ) : (
            <p className={styles.noOpenIssues}>
              Nu există alte neconcordanțe active care necesită o decizie acum.
            </p>
          )}

          <details className={styles.allFacts}>
            <summary className="focus-ring">
              {truth.sourceCount} surse · Toate faptele evaluate
            </summary>
            <div className={styles.allFactsList}>
              {truth.claims.map((fact) => (
                <div key={fact.id} className={styles.allFact}>
                  <p>
                    <strong>{fact.label}</strong>
                    <span>{fact.value}</span>
                  </p>
                  <small>
                    {fact.derivation === "explicit_source_field"
                      ? "Menționat explicit în document"
                      : "Înregistrat în context"}
                    {" · "}
                    {fact.observedAt
                      ? formatProductDateTime(fact.observedAt)
                      : "dată neconfirmată"}
                    {fact.freshness === "old" ? " · sursă veche" : ""}
                  </small>
                  <EvidenceList items={fact.evidence} />
                </div>
              ))}
            </div>
          </details>

          {truth.limitations.length ? (
            <details className={styles.limitations}>
              <summary className="focus-ring">Limite ale verificării</summary>
              <p>{truth.limitations.join(" ")}</p>
            </details>
          ) : null}

          <div className={styles.secondaryActions}>
            <Button
              href={`/opportunities/${truth.opportunityId}?tab=files`}
              variant="secondary"
              size="small"
            >
              Verifică documentele
            </Button>
            {onPrepare ? (
              <Button onClick={onPrepare} variant="secondary" size="small">
                {prepareLabel}
              </Button>
            ) : (
              <Button
                size="small"
                variant="secondary"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("revenew:open-contextual-assistant", {
                      detail: { question: "Pregătește următorul pas." }
                    })
                  )
                }
              >
                Pregătește următorul pas
              </Button>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
