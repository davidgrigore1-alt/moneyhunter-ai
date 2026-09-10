"use client";

import {
  BuildingOffice2Icon,
  DocumentTextIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import type { CommercialTruth } from "@/lib/commercial-truth";
import styles from "./ContextIntegrityStrip.module.css";

export function ContextIntegrityStrip({ truth }: { truth: CommercialTruth }) {
  const issue = truth.issues.find(
    (item) =>
      item.origin === "context_integrity" &&
      item.kind === "interpretation" &&
      item.state === "needs_review"
  );

  if (!issue || !truth.contextIntegrity?.findings.length) return null;

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
          <h4>Asocierea necesită revizuire</h4>
        </div>
        <span className={styles.controlBadge}>
          <ShieldCheckIcon aria-hidden="true" />
          Control uman
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
          <p>{issue.whyItMatters}</p>
          <strong>{issue.nextStep}</strong>
        </div>
        <span>Fără modificare automată</span>
      </div>

      {evidence ? (
        <p className={styles.source}>
          {evidenceTitle}
          {evidenceLocation ? ` · ${evidenceLocation}` : ""}
        </p>
      ) : null}
    </section>
  );
}
