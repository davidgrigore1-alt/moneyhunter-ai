"use client";

import { useState } from "react";
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import type { CommercialTruth } from "@/lib/commercial-truth";
import type { ContextIntegrityResolutionReason } from "@/lib/context-integrity/types";
import { resolveContextIntegrityFindingAction } from "@/lib/context-integrity/actions";
import { formatProductDateTime } from "@/lib/ui/presentation";
import styles from "./ContextIntegrityStrip.module.css";

const resolutionOptions: Array<{
  reason: ContextIntegrityResolutionReason;
  label: string;
  detail: string;
}> = [
  {
    reason: "kept_current_context",
    label: "Păstrează contextul CRM",
    detail: "Contextul CRM rămâne referința de lucru pentru această oportunitate."
  },
  {
    reason: "source_belongs_elsewhere",
    label: "Documentul aparține altui context",
    detail: "Consemnează decizia fără să muți sau să reasociezi automat documentul."
  },
  {
    reason: "observation_marked_historical",
    label: "Documentul este istoric",
    detail: "Informația rămâne dovadă, dar nu este tratată ca stare comercială curentă."
  },
  {
    reason: "dismissed_with_reason",
    label: "Constatarea nu se aplică",
    detail: "Respinge finding-ul și explică motivul în audit."
  }
];

function resolutionLabel(reason: ContextIntegrityResolutionReason | null | undefined) {
  return resolutionOptions.find((item) => item.reason === reason)?.label ?? "Decizie consemnată";
}

export function ContextIntegrityStrip({ truth }: { truth: CommercialTruth }) {
  const [localDecision, setLocalDecision] = useState<{
    state: "resolved" | "dismissed";
    reason: ContextIntegrityResolutionReason;
    rowVersion: number;
    resolvedAt: string;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedReason, setSelectedReason] =
    useState<ContextIntegrityResolutionReason | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const issue = truth.issues.find(
    (item) =>
      item.origin === "context_integrity" &&
      item.kind === "interpretation" &&
      item.state === "needs_review"
  );

  const finding = issue?.integrityFindingKey
    ? truth.contextIntegrity?.findings.find(
        (item) => item.key === issue.integrityFindingKey
      )
    : truth.contextIntegrity?.findings[0];

  if (!issue || !finding) return null;

  const findingKey = finding.key;

  const claims = truth.claims.filter(
    (claim) => issue.claimIds.includes(claim.id) && claim.type === "customer_identity"
  );

  const canonical =
    claims.find((claim) => claim.derivation === "structured_record") ?? null;
  const external =
    claims.find((claim) => claim.derivation === "explicit_source_field") ?? null;

  if (!canonical || !external || canonical.value === external.value) return null;

  const evidence =
    external.evidence.find((item) => item.sourceType === "document") ??
    external.evidence[0];
  const evidenceTitle =
    evidence?.title?.trim().toLocaleLowerCase("en-US") === "untitled document"
      ? "Document Google Drive"
      : evidence?.title;
  const evidenceLocation = evidence?.sourceLocation
    ?.replace(/^Text export\s*·?\s*/i, "")
    .trim();

  const persisted = truth.contextIntegrityPersistence?.cases.find(
    (item) => item.findingKey === findingKey
  );

  const effectiveState = localDecision?.state ?? persisted?.state;
  const effectiveReason = localDecision?.reason ?? persisted?.resolutionReason;
  const effectiveRowVersion = localDecision?.rowVersion ?? persisted?.rowVersion;
  const effectiveResolvedAt = localDecision?.resolvedAt ?? persisted?.resolvedAt;
  const reviewed =
    effectiveState === "resolved" || effectiveState === "dismissed";
  const canReview =
    truth.contextIntegrityPersistence?.status === "saved" &&
    Boolean(persisted?.id && effectiveRowVersion);

  async function submitResolution() {
    if (
      !persisted?.id ||
      !effectiveRowVersion ||
      !selectedReason ||
      submitting
    ) {
      return;
    }

    if (
      selectedReason === "dismissed_with_reason" &&
      note.trim().length < 3
    ) {
      setActionError("Adaugă un motiv scurt pentru respingerea constatării.");
      return;
    }

    setSubmitting(true);
    setActionError("");

    const result = await resolveContextIntegrityFindingAction({
      opportunityId: truth.opportunityId,
      findingId: persisted.id,
      expectedRowVersion: effectiveRowVersion,
      expectedFindingKey: findingKey,
      reason: selectedReason,
      note: note.trim() || null
    });

    if (!result.ok) {
      setActionError(result.error);
      setSubmitting(false);
      return;
    }

    setLocalDecision({
      state: result.state,
      reason: result.reason,
      rowVersion: result.rowVersion,
      resolvedAt: result.resolvedAt
    });
    setReviewOpen(false);
    setSelectedReason(null);
    setNote("");
    setSubmitting(false);
  }

  function openReview() {
    setSelectedReason(
      effectiveReason &&
        resolutionOptions.some((item) => item.reason === effectiveReason)
        ? effectiveReason
        : null
    );
    setActionError("");
    setReviewOpen(true);
  }

  return (
    <section className={styles.root} aria-label="Integritatea contextului">
      <div className={styles.flow} aria-hidden="true">
        <span>Context canonic</span>
        <i>→</i>
        <span>Dovadă externă</span>
        <i>→</i>
        <span>Conflict</span>
        <i>→</i>
        <span>Decizie umană</span>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Integritatea contextului</p>
          <h4>{reviewed ? "Decizie consemnată" : "Asocierea necesită revizuire"}</h4>
        </div>
        <span className={styles.controlBadge}>
          {reviewed ? (
            <CheckCircleIcon aria-hidden="true" />
          ) : (
            <ShieldCheckIcon aria-hidden="true" />
          )}
          {reviewed ? "Revizuit" : "Control uman"}
        </span>
      </div>

      <div className={styles.comparison}>
        <div className={styles.identity}>
          <div className={styles.identityMeta}>
            <BuildingOffice2Icon aria-hidden="true" />
            <span>CRM · context curent</span>
          </div>
          <strong title={canonical.value}>{canonical.value}</strong>
        </div>

        <div className={styles.conflict} aria-label="Valorile diferă">
          <span>≠</span>
        </div>

        <div className={styles.identity}>
          <div className={styles.identityMeta}>
            <DocumentTextIcon aria-hidden="true" />
            <span>Document · client declarat</span>
          </div>
          <strong title={external.value}>{external.value}</strong>
        </div>
      </div>

      <div className={styles.decision}>
        <div>
          {reviewed ? (
            <>
              <p>{resolutionLabel(effectiveReason)}</p>
              <strong>Decizia a fost salvată după reverificarea contextului.</strong>
            </>
          ) : (
            <>
              <p>{issue.whyItMatters}</p>
              <strong>{issue.nextStep}</strong>
            </>
          )}
        </div>
        <span>Fără modificare automată</span>
      </div>

      {evidence ? (
        <p className={styles.source}>
          {evidenceTitle}
          {evidenceLocation ? ` · ${evidenceLocation}` : ""}
        </p>
      ) : null}

      {reviewed ? (
        <div className={styles.reviewedFooter}>
          <div>
            <span>Decizie umană</span>
            <strong>
              {effectiveResolvedAt
                ? formatProductDateTime(effectiveResolvedAt)
                : "consemnată"}
            </strong>
          </div>
          {canReview ? (
            <button type="button" onClick={openReview} className={styles.secondaryAction}>
              Modifică decizia
            </button>
          ) : null}
        </div>
      ) : canReview ? (
        <div className={styles.reviewFooter}>
          <p>ReveNew reverifică starea curentă înainte de salvarea deciziei.</p>
          <button type="button" onClick={openReview} className={styles.reviewAction}>
            Revizuiește asocierea
          </button>
        </div>
      ) : (
        <p className={styles.persistenceNotice}>
          Revizuirea persistentă nu este disponibilă momentan. Finding-ul rămâne nemodificat.
        </p>
      )}

      {reviewOpen ? (
        <div className={styles.reviewPanel}>
          <div className={styles.reviewPanelHeader}>
            <div>
              <p className={styles.reviewEyebrow}>Decizie umană</p>
              <h5>Ce ai constatat?</h5>
            </div>
            <button
              type="button"
              className={styles.closeReview}
              onClick={() => {
                if (!submitting) setReviewOpen(false);
              }}
              aria-label="Închide revizuirea"
            >
              ×
            </button>
          </div>

          <div className={styles.optionList}>
            {resolutionOptions.map((option) => (
              <label
                key={option.reason}
                className={`${styles.option} ${
                  selectedReason === option.reason ? styles.optionSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name={`context-integrity-${findingKey}`}
                  value={option.reason}
                  checked={selectedReason === option.reason}
                  onChange={() => {
                    setSelectedReason(option.reason);
                    setActionError("");
                  }}
                  disabled={submitting}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
              </label>
            ))}
          </div>

          {selectedReason ? (
            <label className={styles.noteField}>
              <span>
                Notă pentru audit
                {selectedReason === "dismissed_with_reason" ? " · obligatorie" : " · opțională"}
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 1000))}
                rows={3}
                disabled={submitting}
                placeholder={
                  selectedReason === "dismissed_with_reason"
                    ? "De ce nu se aplică această constatare?"
                    : "Context suplimentar pentru decizie"
                }
              />
            </label>
          ) : null}

          {actionError ? (
            <p className={styles.actionError} role="status">{actionError}</p>
          ) : null}

          <div className={styles.reviewActions}>
            <button
              type="button"
              className={styles.cancelAction}
              onClick={() => setReviewOpen(false)}
              disabled={submitting}
            >
              Anulează
            </button>
            <button
              type="button"
              className={styles.confirmAction}
              onClick={() => void submitResolution()}
              disabled={
                submitting ||
                !selectedReason ||
                (selectedReason === "dismissed_with_reason" && note.trim().length < 3)
              }
            >
              {submitting ? "Reverifică și salvează…" : "Consemnează decizia"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
