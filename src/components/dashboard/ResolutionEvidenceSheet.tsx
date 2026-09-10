"use client";

import Link from "next/link";
import {
  ArrowUpRightIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { RecoveryTimelineItem } from "@/lib/recovery-timeline/types";
import {
  formatProductCurrency,
  formatProductDateTime
} from "@/lib/ui/presentation";
import styles from "./ResolutionEvidenceSheet.module.css";

function durationLabel(minutes: number | null) {
  if (minutes === null) return "În curs";
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  if (minutes < 1_440) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours.toLocaleString("ro-RO")} h`;
  }
  const days = Math.round((minutes / 1_440) * 10) / 10;
  return `${days.toLocaleString("ro-RO")} zile`;
}

function statusLabel(item: RecoveryTimelineItem) {
  if (item.status === "resolved") return "Rezolvată";
  if (item.status === "reopened") return "Reapărută";
  return "Deschisă";
}

function domainLabel(item: RecoveryTimelineItem) {
  return item.domain === "execution"
    ? "Execuție comercială"
    : "Integritatea contextului";
}

function sourceLabel(sourceType: string) {
  const labels: Record<string, string> = {
    opportunity: "Oportunitate",
    action: "Acțiune",
    approval: "Aprobare",
    document: "Document",
    drive_document: "Google Drive",
    google_drive: "Google Drive",
    audit_event: "Audit verificabil",
    crm: "CRM",
    commercial_truth: "Context comercial"
  };
  return labels[sourceType] ?? "Dovadă";
}

export function ResolutionEvidenceSheet({
  item,
  onClose
}: {
  item: RecoveryTimelineItem | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return;

    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const scrollingElement = document.scrollingElement;
    const scrollTop = scrollingElement?.scrollTop ?? window.scrollY;
    const scrollLeft = scrollingElement?.scrollLeft ?? window.scrollX;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      closeRef.current?.focus({ preventScroll: true });

      if (scrollingElement) {
        scrollingElement.scrollTo({
          top: scrollTop,
          left: scrollLeft,
          behavior: "auto"
        });
      } else {
        window.scrollTo({
          top: scrollTop,
          left: scrollLeft,
          behavior: "auto"
        });
      }
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      previous?.focus({ preventScroll: true });
    };
  }, [item, onClose]);

  if (!item) return null;

  const primaryHref =
    item.status === "resolved"
      ? `/opportunities/${encodeURIComponent(item.opportunityId)}`
      : item.safeActionHref;

  return createPortal(
    <div className={styles.portal}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Închide Resolution Evidence"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolution-evidence-title"
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Dovada rezolvării</p>
            <h2 id="resolution-evidence-title">{item.title}</h2>
            <p>
              {item.organizationName}
              <span aria-hidden="true"> · </span>
              {item.opportunityTitle}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={`focus-ring ${styles.close}`}
            aria-label="Închide"
          >
            <XMarkIcon aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.stateHero}>
            <div>
              <span
                className={styles.status}
                data-status={item.status}
              >
                {item.status === "resolved" ? (
                  <CheckIcon aria-hidden="true" />
                ) : null}
                {statusLabel(item)}
              </span>
              <p className={styles.domain}>{domainLabel(item)}</p>
            </div>
            <p className={styles.description}>{item.description}</p>
          </section>

          <dl className={styles.lifecycleMetrics}>
            <div>
              <dt>Prima detecție</dt>
              <dd>{formatProductDateTime(item.firstDetectedAt)}</dd>
            </div>
            <div>
              <dt>
                {item.resolvedAt ? "Rezolvată" : "Ultima verificare"}
              </dt>
              <dd>
                {formatProductDateTime(
                  item.resolvedAt ?? item.lastEvaluatedAt
                )}
              </dd>
            </div>
            <div>
              <dt>Timp urmărit</dt>
              <dd>{durationLabel(item.durationMinutes)}</dd>
            </div>
          </dl>

          {item.resolutionSummary ? (
            <section className={styles.section}>
              <p className={styles.sectionEyebrow}>Ce s-a schimbat</p>
              <h3>{item.resolutionSummary}</h3>
              <div className={styles.resolutionMeta}>
                {item.resolutionActorLabel ? (
                  <span>{item.resolutionActorLabel}</span>
                ) : null}
                {item.resolvedAt ? (
                  <span>
                    {formatProductDateTime(item.resolvedAt)}
                  </span>
                ) : null}
              </div>
              {item.resolutionNote ? (
                <blockquote className={styles.note}>
                  {item.resolutionNote}
                </blockquote>
              ) : null}
            </section>
          ) : (
            <section className={styles.section}>
              <p className={styles.sectionEyebrow}>Ce urmează</p>
              <h3>{item.safeActionLabel}</h3>
              <p className={styles.sectionText}>
                {item.domain === "execution"
                  ? "Cazul rămâne deschis până când starea reală se schimbă în sursa relevantă."
                  : "Cazul rămâne deschis până când este consemnată decizia umană necesară sau sursele se schimbă."}
              </p>
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Dovezi</p>
                <h3>Dovada verificabilă</h3>
              </div>
              <span>
                {item.evidence.length}{" "}
                {item.evidence.length === 1 ? "sursă" : "surse"}
              </span>
            </div>

            {item.evidence.length ? (
              <div className={styles.evidenceList}>
                {item.evidence.map((evidence, index) => (
                  <Link
                    key={evidence.id}
                    href={evidence.href}
                    className={`focus-ring ${styles.evidenceRow}`}
                    onClick={onClose}
                  >
                    <span className={styles.evidenceIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.evidenceCopy}>
                      <strong>{evidence.label}</strong>
                      <small>
                        {sourceLabel(evidence.sourceType)}
                        {evidence.observedAt
                          ? ` · ${formatProductDateTime(
                              evidence.observedAt
                            )}`
                          : ""}
                        {evidence.actorLabel
                          ? ` · ${evidence.actorLabel}`
                          : ""}
                      </small>
                    </span>
                    <ArrowUpRightIcon aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.emptyEvidence}>
                Cazul are audit persistent, dar nu există încă o
                referință suplimentară disponibilă pentru inspectare.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Istoric verificabil</p>
                <h3>Evoluția cazului</h3>
              </div>
              <span>
                {item.lifecycle.length}{" "}
                {item.lifecycle.length === 1 ? "moment" : "momente"}
              </span>
            </div>

            <ol className={styles.lifecycle}>
              {item.lifecycle.map((step) => (
                <li key={step.id} data-kind={step.kind}>
                  <span className={styles.lifecycleRail} aria-hidden="true">
                    <i />
                  </span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>
                      {formatProductDateTime(step.at)}
                      {step.actorLabel
                        ? ` · ${step.actorLabel}`
                        : ""}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.commercialContext}>
            <div>
              <span>Responsabil</span>
              <strong>{item.ownerName}</strong>
            </div>
            <div>
              <span>Valoare asociată</span>
              <strong>
                {item.estimatedValue !== null
                  ? formatProductCurrency(
                      item.estimatedValue,
                      item.currency
                    )
                  : "Neconfirmată"}
              </strong>
            </div>
            <p>
              Valoarea este estimată și asociată oportunității.
              Nu reprezintă venit recuperat.
            </p>
          </section>
        </div>

        <footer className={styles.footer}>
          <Link
            href={primaryHref}
            className={`focus-ring ${styles.primaryAction}`}
            onClick={onClose}
          >
            {item.status === "resolved"
              ? "Deschide oportunitatea"
              : item.safeActionLabel}
            <ArrowUpRightIcon aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </div>,
    document.body
  );
}
