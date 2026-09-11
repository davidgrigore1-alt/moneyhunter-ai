"use client";

import {
  ArrowRightIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { ResolutionEvidenceSheet } from "@/components/dashboard/ResolutionEvidenceSheet";
import type { RecoveryTimelineItem } from "@/lib/recovery-timeline/types";
import {
  formatProductCurrency,
  formatProductDateTime
} from "@/lib/ui/presentation";
import styles from "./PilotProofOfValue.module.css";

function duration(minutes: number | null) {
  if (minutes === null) return "durată indisponibilă";
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  if (minutes < 1_440) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours.toLocaleString("ro-RO")} h`;
  }
  const days = Math.round((minutes / 1_440) * 10) / 10;
  return `${days.toLocaleString("ro-RO")} zile`;
}

export function PilotVerifiedRecovery({
  items
}: {
  items: RecoveryTimelineItem[];
}) {
  const [selected, setSelected] =
    useState<RecoveryTimelineItem | null>(null);

  if (!items.length) return null;

  return (
    <>
      <div className={styles.verifiedRows}>
        {items.map((item) => (
          <article key={item.id} className={styles.verifiedRow}>
            <span className={styles.verifiedMark} aria-hidden="true">
              <CheckIcon />
            </span>

            <div className={styles.verifiedIdentity}>
              <h3>{item.title}</h3>
              <p>
                {item.organizationName}
                <span aria-hidden="true"> · </span>
                {item.opportunityTitle}
              </p>
            </div>

            <div className={styles.verifiedResolution}>
              <span>
                {item.resolvedAt
                  ? formatProductDateTime(item.resolvedAt)
                  : "Rezolvare verificată"}
              </span>
              <strong>
                {item.resolutionSummary ??
                  "Starea sursei nu mai generează ruptura."}
              </strong>
              <small>
                {duration(item.durationMinutes)}
                {item.estimatedValue !== null
                  ? ` · ${formatProductCurrency(
                      item.estimatedValue,
                      item.currency
                    )} estimat`
                  : ""}
              </small>
            </div>

            <button
              type="button"
              className={`focus-ring ${styles.verifiedAction}`}
              onClick={() => setSelected(item)}
            >
              Vezi dovada
              <ArrowRightIcon aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>

      <ResolutionEvidenceSheet
        item={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
