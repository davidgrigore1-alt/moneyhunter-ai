import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type {
  ContextIntegrityRecoveryItem,
  ContextIntegrityRecoveryQueue as ContextIntegrityRecoveryQueueModel
} from "@/lib/context-integrity/recovery-queue";
import { CONTEXT_INTEGRITY_RECOVERY_LIMITS } from "@/lib/context-integrity/recovery-queue";
import {
  formatProductCurrency,
  formatProductDateTime
} from "@/lib/ui/presentation";
import styles from "./ContextIntegrityRecoveryQueue.module.css";

function ageLabel(days: number) {
  if (days <= 0) return "detectat astăzi";
  if (days === 1) return "deschis de 1 zi";
  return `deschis de ${days} zile`;
}

function severityLabel(item: ContextIntegrityRecoveryItem) {
  if (item.severity === "critical") return "Critic";
  if (item.severity === "high") return "Prioritate ridicată";
  if (item.severity === "medium") return "Necesită atenție";
  return "De revizuit";
}

function QueueRow({ item }: { item: ContextIntegrityRecoveryItem }) {
  return (
    <article className={styles.row}>
      <div
        className={styles.severityMark}
        data-severity={item.severity}
        aria-hidden="true"
      />
      <div className={styles.rowMain}>
        <div className={styles.rowHeader}>
          <div className={styles.identity}>
            <h3>{item.organization}</h3>
            <p>{item.opportunityTitle}</p>
          </div>
          <span className={styles.severity}>
            {severityLabel(item)}
          </span>
        </div>

        <p className={styles.primaryReason}>{item.primaryLabel}</p>
        <p className={styles.impact}>{item.whyItMatters}</p>

        <div className={styles.meta}>
          <span>{item.owner}</span>
          <span>{ageLabel(item.ageDays)}</span>
          <span>
            {item.findingCount}{" "}
            {item.findingCount === 1
              ? "neconcordanță"
              : "neconcordanțe"}
          </span>
          {item.estimatedValue !== null ? (
            <span>
              {formatProductCurrency(
                item.estimatedValue,
                item.currency
              )}{" "}
              estimat
            </span>
          ) : null}
        </div>
      </div>

      <Link
        href={item.reviewHref}
        className={`focus-ring ${styles.action}`}
      >
        {item.safeActionLabel}
        <ArrowRightIcon aria-hidden="true" />
      </Link>
    </article>
  );
}

export function ContextIntegrityRecoveryQueue({
  queue,
  embedded = false
}: {
  queue: ContextIntegrityRecoveryQueueModel | null;
  embedded?: boolean;
}) {
  if (!queue?.items.length) return null;

  const visibleLimit = embedded
    ? Math.min(2, CONTEXT_INTEGRITY_RECOVERY_LIMITS.visibleRows)
    : CONTEXT_INTEGRITY_RECOVERY_LIMITS.visibleRows;
  const primaryItems = queue.items.slice(0, visibleLimit);
  const remainingItems = queue.items.slice(visibleLimit);

  return (
    <section
      className={`${styles.root} ${embedded ? styles.embedded : ""}`}
      aria-labelledby={embedded ? undefined : "context-integrity-recovery-title"}
    >
      {!embedded ? (
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Integritate comercială</p>
            <h2 id="context-integrity-recovery-title">
              Necesită decizie înainte de execuție
            </h2>
            <p className={styles.description}>
              Neconcordanțe persistente între contextul comercial și
              sursele conectate. Rămân vizibile până la o decizie
              umană.
            </p>
          </div>

          <div className={styles.summary}>
            <strong>{queue.opportunityCount}</strong>
            <span>
              {queue.opportunityCount === 1 ? "caz activ" : "cazuri active"}
            </span>
          </div>
        </header>
      ) : null}

      <div className={styles.list}>
        {primaryItems.map((item) => (
          <QueueRow key={item.opportunityId} item={item} />
        ))}
      </div>

      {remainingItems.length ? (
        <details className={styles.more}>
          <summary className="focus-ring">
            Vezi încă {remainingItems.length}{" "}
            {remainingItems.length === 1 ? "caz" : "cazuri"}
          </summary>
          <div className={styles.list}>
            {remainingItems.map((item) => (
              <QueueRow key={item.opportunityId} item={item} />
            ))}
          </div>
        </details>
      ) : null}

      <footer className={`${styles.footer} ${embedded ? styles.embeddedFooter : ""}`}>
        {!embedded ? (
          <>
            <span>
              {queue.highPriorityCount
                ? `${queue.highPriorityCount} ${
                    queue.highPriorityCount === 1
                      ? "caz cu prioritate ridicată"
                      : "cazuri cu prioritate ridicată"
                  }`
                : "Fără cazuri critice"}
            </span>
            <span>
              {queue.oldestAgeDays && queue.oldestAgeDays > 0
                ? `Cel mai vechi · ${queue.oldestAgeDays} ${
                    queue.oldestAgeDays === 1 ? "zi" : "zile"
                  }`
                : "Cele mai vechi cazuri · astăzi"}
            </span>
          </>
        ) : null}
        {queue.limited ? (
          <span>Vizualizare limitată la contextul autorizat disponibil</span>
        ) : null}
        <span className={styles.boundary}>
          Valoarea afișată este estimată, nu venit recuperat.
        </span>
      </footer>
    </section>
  );
}
