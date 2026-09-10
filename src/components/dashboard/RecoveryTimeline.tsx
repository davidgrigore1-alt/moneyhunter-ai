"use client";

import {
  ArrowRightIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import type {
  RecoveryTimelineItem,
  RecoveryTimelineModel
} from "@/lib/recovery-timeline/types";
import { RECOVERY_TIMELINE_LIMITS } from "@/lib/recovery-timeline/model";
import {
  formatProductCurrency,
  formatProductDateTime
} from "@/lib/ui/presentation";
import { ResolutionEvidenceSheet } from "./ResolutionEvidenceSheet";
import styles from "./RecoveryTimeline.module.css";

function statusLabel(item: RecoveryTimelineItem) {
  if (item.status === "resolved") return "Rezolvată";
  if (item.status === "reopened") return "Reapărută";
  return "Deschisă";
}

function ageLabel(item: RecoveryTimelineItem) {
  if (item.status === "resolved" && item.resolvedAt) {
    return `Rezolvată · ${formatProductDateTime(item.resolvedAt)}`;
  }
  if (item.ageDays <= 0) return "Urmărită de ReveNew azi";
  if (item.ageDays === 1) return "Urmărită de 1 zi";
  return `Urmărită de ${item.ageDays} zile`;
}

function averageLabel(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  if (minutes < 1_440) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours.toLocaleString("ro-RO")} h`;
  }
  const days = Math.round((minutes / 1_440) * 10) / 10;
  return `${days.toLocaleString("ro-RO")} zile`;
}

function valueMetric(model: RecoveryTimelineModel) {
  if (!model.valueAssociated.length) {
    return <strong>Fără valori</strong>;
  }

  return (
    <strong className={styles.moneyValues}>
      {model.valueAssociated.slice(0, 2).map((item) => (
        <span key={item.currency}>
          {formatProductCurrency(item.amount, item.currency)}
        </span>
      ))}
      {model.valueAssociated.length > 2 ? (
        <small>+{model.valueAssociated.length - 2} monede</small>
      ) : null}
    </strong>
  );
}

function TimelineRow({
  item,
  onOpen
}: {
  item: RecoveryTimelineItem;
  onOpen: (item: RecoveryTimelineItem) => void;
}) {
  return (
    <article className={styles.row}>
      <span className={styles.rail} aria-hidden="true">
        <i data-status={item.status}>
          {item.status === "resolved" ? <CheckIcon /> : null}
        </i>
      </span>

      <div className={styles.rowContent}>
        <div className={styles.rowTop}>
          <div className={styles.identity}>
            <div className={styles.titleLine}>
              <h3>{item.title}</h3>
              <span
                className={styles.status}
                data-status={item.status}
              >
                {statusLabel(item)}
              </span>
            </div>
            <p>
              {item.organizationName}
              <span aria-hidden="true"> · </span>
              {item.opportunityTitle}
            </p>
          </div>
          <span className={styles.age}>{ageLabel(item)}</span>
        </div>

        <p className={styles.description}>{item.description}</p>

        {item.resolutionSummary ? (
          <p className={styles.resolution}>
            <span aria-hidden="true">✓</span>
            {item.resolutionSummary}
          </p>
        ) : null}

        <div className={styles.rowFooter}>
          <div className={styles.meta}>
            <span>{item.ownerName}</span>
            {item.estimatedValue !== null ? (
              <span>
                {formatProductCurrency(
                  item.estimatedValue,
                  item.currency
                )}{" "}
                estimat
              </span>
            ) : null}
            <span>
              {item.domain === "execution"
                ? "Execuție"
                : "Context"}
            </span>
          </div>

          <button
            type="button"
            className={`focus-ring ${styles.evidenceAction}`}
            onClick={() => onOpen(item)}
          >
            Vezi dovada
            <ArrowRightIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function RecoveryTimeline({
  model
}: {
  model: RecoveryTimelineModel | null;
}) {
  const [selected, setSelected] =
    useState<RecoveryTimelineItem | null>(null);
  const [expanded, setExpanded] = useState(false);

  const ordered = useMemo(() => model?.items ?? [], [model]);
  if (!model || !ordered.length) return null;

  const active = ordered.filter(
    (item) => item.status !== "resolved"
  );
  const resolved = ordered.filter(
    (item) => item.status === "resolved"
  );

  const defaultLimit = RECOVERY_TIMELINE_LIMITS.defaultVisible;
  const activeLimit =
    active.length && resolved.length
      ? Math.min(3, active.length)
      : Math.min(defaultLimit, active.length);
  const resolvedLimit = Math.min(
    defaultLimit - activeLimit,
    resolved.length
  );

  const visibleActive = expanded
    ? active
    : active.slice(0, activeLimit);
  const visibleResolved = expanded
    ? resolved
    : resolved.slice(0, resolvedLimit);
  const visibleCount =
    visibleActive.length + visibleResolved.length;
  const remaining = ordered.length - visibleCount;

  return (
    <>
      <section
        className={styles.root}
        aria-labelledby="recovery-timeline-title"
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Dovadă operațională</p>
            <h2 id="recovery-timeline-title">Recovery Timeline</h2>
            <p>
              Ce a detectat ReveNew, cât timp a urmărit cazul și prin
              ce schimbare verificabilă s-a închis.
            </p>
          </div>

          <div className={styles.headerMeta}>
            <span>Ultimele {model.windowDays} zile</span>
            {model.coverage === "partial" ? (
              <span className={styles.partial}>
                Istoric disponibil parțial
              </span>
            ) : null}
          </div>
        </header>

        <dl className={styles.metrics}>
          <div>
            <dt>Deschise</dt>
            <dd>{model.openCount}</dd>
            {model.reopenedCount ? (
              <small>{model.reopenedCount} reapărute</small>
            ) : (
              <small>cazuri active</small>
            )}
          </div>
          <div>
            <dt>Rezolvate</dt>
            <dd>{model.resolvedCount}</dd>
            <small>în fereastra curentă</small>
          </div>
          <div>
            <dt>Timp mediu de rezolvare</dt>
            <dd>{averageLabel(model.averageResolutionMinutes)}</dd>
            <small>de la prima detecție</small>
          </div>
          <div>
            <dt>Valoare estimată asociată</dt>
            <dd>{valueMetric(model)}</dd>
            <small>nu venit recuperat</small>
          </div>
        </dl>

        <div className={styles.timeline}>
          {visibleActive.length ? (
            <div className={styles.group}>
              <div className={styles.groupHeader}>
                <h3>Necesită atenție</h3>
                <span>{active.length}</span>
              </div>
              <div className={styles.rows}>
                {visibleActive.map((item) => (
                  <TimelineRow
                    key={item.id}
                    item={item}
                    onOpen={setSelected}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {visibleResolved.length ? (
            <div className={styles.group}>
              <div className={styles.groupHeader}>
                <h3>Rezolvate recent</h3>
                <span>{resolved.length}</span>
              </div>
              <div className={styles.rows}>
                {visibleResolved.map((item) => (
                  <TimelineRow
                    key={item.id}
                    item={item}
                    onOpen={setSelected}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <footer className={styles.footer}>
          {remaining > 0 || expanded ? (
            <button
              type="button"
              className={`focus-ring ${styles.expandAction}`}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? "Arată mai puțin"
                : `Vezi încă ${remaining} ${
                    remaining === 1 ? "caz" : "cazuri"
                  }`}
            </button>
          ) : null}
          <p>
            Fiecare rezolvare provine din audit, schimbarea unei
            surse sau o decizie umană consemnată.
          </p>
        </footer>
      </section>

      <ResolutionEvidenceSheet
        item={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
