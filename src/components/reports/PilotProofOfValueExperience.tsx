import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { PrintProofOfValueButton } from "@/components/reports/PrintProofOfValueButton";
import { PilotVerifiedRecovery } from "@/components/reports/PilotVerifiedRecovery";
import { Button } from "@/components/ui/Button";
import {
  closePilotEngagement,
  createPilotEngagement,
  freezePilotBaseline,
  freezePilotFinal
} from "@/lib/pilot-measurement-actions";
import type {
  PilotComparison,
  PilotCriterionEvaluation,
  PilotSnapshotPayload
} from "@/lib/pilot-measurement-core";
import type {
  PilotEngagement,
  PilotMeasurementWorkspace
} from "@/lib/pilot-measurement";
import type {
  PilotRecoveryProof
} from "@/lib/pilot-proof-recovery";
import {
  formatCurrency,
  formatDateTimeWithSeconds
} from "@/lib/utils";
import styles from "./PilotProofOfValue.module.css";

const statusLabels = {
  draft: "Configurare",
  active: "Pilot activ",
  final_frozen: "Situație finală confirmată",
  closed: "Pilot închis",
  cancelled: "Pilot anulat"
} as const;

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function durationLabel(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  if (minutes < 1_440) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours.toLocaleString("ro-RO")} h`;
  }
  const days = Math.round((minutes / 1_440) * 10) / 10;
  return `${days.toLocaleString("ro-RO")} zile`;
}

function percent(part: number, total: number) {
  if (total <= 0) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

function CurrencyValues({
  values,
  empty = "—"
}: {
  values: Array<{ currency: string; value: number }>;
  empty?: string;
}) {
  if (!values.length) {
    return <span className={styles.currencyEmpty}>{empty}</span>;
  }

  return (
    <span className={styles.currencyValues}>
      {values.slice(0, 2).map((item) => (
        <strong key={item.currency}>
          {formatCurrency(item.value, item.currency)}
        </strong>
      ))}
      {values.length > 2 ? (
        <small>+{values.length - 2} monede</small>
      ) : null}
    </span>
  );
}

function StageRail({
  status,
  hasBaseline,
  hasFinal
}: {
  status?: PilotEngagement["status"];
  hasBaseline: boolean;
  hasFinal: boolean;
}) {
  const stages = [
    {
      id: "contract",
      label: "Contract",
      hint: "Definește pilotul"
    },
    {
      id: "baseline",
      label: "Baseline",
      hint: "Fixează situația inițială"
    },
    {
      id: "pilot",
      label: "Pilot",
      hint: "Rulează și monitorizează"
    },
    {
      id: "final",
      label: "Situație finală",
      hint: "Măsoară rezultatele"
    },
    {
      id: "decision",
      label: "Decizie",
      hint: "Analizează și decide"
    }
  ];

  let current = 0;
  if (!status) current = 0;
  else if (status === "draft") current = hasBaseline ? 2 : 1;
  else if (status === "active") current = 2;
  else if (status === "final_frozen") current = 4;
  else if (status === "closed") current = 5;
  else current = hasFinal ? 4 : hasBaseline ? 2 : 1;

  return (
    <ol className={styles.stageRail} aria-label="Etapele pilotului">
      {stages.map((stage, index) => {
        const state =
          current === 5 || index < current
            ? "done"
            : index === current
              ? "current"
              : "upcoming";
        return (
          <li key={stage.id} data-state={state}>
            <span className={styles.stageIndex}>
              {state === "done" ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <span className={styles.stageCopy}>
              <strong>{stage.label}</strong>
              <small>{stage.hint}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ProofSection({
  eyebrow,
  title,
  description,
  children,
  id
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={styles.section}>
      <header className={styles.sectionHeader}>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <span>{description}</span> : null}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function HeroMetric({
  label,
  value,
  detail
}: {
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <div className={styles.heroMetric}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <small>{detail}</small>
    </div>
  );
}

function PilotHero({
  workspace,
  comparison,
  recoveryProof
}: {
  workspace: PilotMeasurementWorkspace;
  comparison: PilotComparison | null;
  recoveryProof: PilotRecoveryProof | null;
}) {
  const pilot = workspace.pilot;
  if (!pilot) return null;

  const snapshot =
    workspace.final?.snapshot_payload ??
    workspace.livePreview ??
    workspace.baseline?.snapshot_payload ??
    null;

  const finalLike = Boolean(workspace.final);
  const activePreview =
    pilot.status === "active" && Boolean(comparison);

  const headline =
    pilot.status === "draft"
      ? "Fixează adevărul înainte de rezultat."
      : finalLike
        ? "Ce s-a schimbat — și ce putem demonstra."
        : "Dovada se construiește pe aceeași cohortă.";

  const description =
    pilot.status === "draft"
      ? "Cohorta, definițiile și criteriile sunt stabilite înainte ca pilotul să poată produce o comparație."
      : finalLike
        ? "Aceeași cohortă, aceeași definiție și dovezi verificabile. Schimbarea observată rămâne separată de orice afirmație de cauzalitate sau venit."
        : "Comparația curentă folosește baseline-ul înghețat. Rezultatul devine oficial numai după confirmarea situației finale.";

  const criteriaTotal = comparison?.criteria.length ?? 0;
  const snapshotCohort = snapshot?.metrics.cohortSize ?? 0;

  return (
    <section className={styles.hero}>
      <div className={styles.heroTop}>
        <div className={styles.heroCopy}>
          <div className={styles.heroStatusLine}>
            <span className={styles.statusPill} data-status={pilot.status}>
              {statusLabels[pilot.status]}
            </span>
            {activePreview ? (
              <span className={styles.previewPill}>Previzualizare</span>
            ) : null}
          </div>

          <p className={styles.heroEyebrow}>Dovadă de valoare · pilot controlat</p>
          <h2>{headline}</h2>
          <p className={styles.heroDescription}>{description}</p>
        </div>

        <dl className={styles.heroIdentity}>
          <div>
            <dt>Client</dt>
            <dd>{pilot.customerFacingName}</dd>
          </div>
          <div>
            <dt>Perioadă</dt>
            <dd>
              {dateLabel(pilot.startsOn)}
              <span aria-hidden="true"> — </span>
              {dateLabel(pilot.expectedEndsOn)}
            </dd>
          </div>
          <div>
            <dt>Cohortă</dt>
            <dd>{pilot.cohortOpportunityIds.length} oportunități</dd>
          </div>
        </dl>
      </div>

      <p className={styles.scope}>{pilot.scopeNote}</p>

      <dl className={styles.heroMetrics}>
        {pilot.status === "cancelled" ? (
          <>
            <HeroMetric
              label="Oportunități în cohortă"
              value={pilot.cohortOpportunityIds.length}
              detail="contractul inițial"
            />
            <HeroMetric
              label="Baseline"
              value={workspace.baseline ? "Înghețat" : "—"}
              detail="rămâne disponibil pentru audit"
            />
            <HeroMetric
              label="Situație finală"
              value={workspace.final ? "Înghețată" : "—"}
              detail="nu este completată artificial"
            />
            <HeroMetric
              label="Dovadă finală"
              value="—"
              detail="pilot anulat"
            />
          </>
        ) : pilot.status === "draft" ? (
          <>
            <HeroMetric
              label="Oportunități în cohortă"
              value={snapshot ? snapshotCohort : "—"}
              detail="lotul comparabil"
            />
            <HeroMetric
              label="Cu responsabil"
              value={
                snapshot
                  ? percent(
                      snapshot.metrics.ownerAssigned,
                      snapshotCohort
                    )
                  : "—"
              }
              detail={
                snapshot
                  ? `${snapshot.metrics.ownerAssigned} din ${snapshotCohort}`
                  : "previzualizare indisponibilă"
              }
            />
            <HeroMetric
              label="Cu următor pas"
              value={
                snapshot
                  ? percent(
                      snapshot.metrics.nextActionDefined,
                      snapshotCohort
                    )
                  : "—"
              }
              detail={
                snapshot
                  ? `${snapshot.metrics.nextActionDefined} din ${snapshotCohort}`
                  : "previzualizare indisponibilă"
              }
            />
            <HeroMetric
              label="Follow-up-uri restante"
              value={snapshot?.metrics.overdueFollowUps ?? "—"}
              detail="la momentul baseline"
            />
          </>
        ) : (
          <>
            <HeroMetric
              label="Criterii îndeplinite"
              value={
                comparison
                  ? `${comparison.criteriaSummary.met}/${criteriaTotal}`
                  : "—"
              }
              detail={
                workspace.final
                  ? "comparație finală"
                  : "previzualizare curentă"
              }
            />
            <HeroMetric
              label="Cazuri închise verificabil"
              value={recoveryProof?.verifiedClosureCount ?? "—"}
              detail="în intervalul măsurat"
            />
            <HeroMetric
              label="Decizii umane pe context"
              value={recoveryProof?.humanContextDecisionCount ?? "—"}
              detail="consemnate în audit"
            />
            <HeroMetric
              label="Valoare estimată asociată"
              value={
                recoveryProof ? (
                  <CurrencyValues
                    values={recoveryProof.associatedValueByCurrency}
                  />
                ) : (
                  "—"
                )
              }
              detail="nu venit recuperat"
            />
          </>
        )}
      </dl>
    </section>
  );
}

function BaselineReference({
  workspace
}: {
  workspace: PilotMeasurementWorkspace;
}) {
  if (!workspace.baseline) return null;

  return (
    <div className={styles.baselineReference}>
      <span className={styles.lockMark}>
        <LockClosedIcon aria-hidden="true" />
      </span>
      <div>
        <strong>Baseline înghețat</strong>
        <p>
          {formatDateTimeWithSeconds(workspace.baseline.captured_at)}
          <span aria-hidden="true"> · </span>
          amprentă {workspace.baseline.integrity_hash.slice(0, 12)}…
        </p>
      </div>
      <span className={styles.baselineDefinition}>
        definiție {workspace.baseline.snapshot_payload.definitionVersion}
      </span>
    </div>
  );
}

function SnapshotSecondary({
  snapshot
}: {
  snapshot: PilotSnapshotPayload;
}) {
  const metrics = snapshot.metrics;

  return (
    <>
      <dl className={styles.secondaryMetrics}>
        <div>
          <dt>Oportunități inactive</dt>
          <dd>{metrics.staleOpportunities}</dd>
        </div>
        <div>
          <dt>Excepții identificate</dt>
          <dd>{metrics.exceptionCount}</dd>
        </div>
        <div>
          <dt>Aprobări în așteptare</dt>
          <dd>{metrics.pendingApprovals}</dd>
        </div>
        <div>
          <dt>Informații lipsă</dt>
          <dd>{metrics.missingDataItems}</dd>
        </div>
      </dl>

      <div className={styles.valuePair}>
        <div>
          <span>Valoare estimată monitorizată</span>
          <CurrencyValues
            values={metrics.estimatedValueByCurrency}
            empty="Fără valoare completă"
          />
          <small>
            Deduplicată pe oportunitate. Nu este venit confirmat.
          </small>
        </div>
        <div>
          <span>Venit confirmat de utilizatori</span>
          <CurrencyValues
            values={metrics.confirmedRevenueByCurrency}
            empty="Fără venit confirmat"
          />
          <small>
            Numai rezultate câștigate confirmate explicit.
          </small>
        </div>
      </div>
    </>
  );
}

function BaselineConfirmation({
  workspace
}: {
  workspace: PilotMeasurementWorkspace;
}) {
  const pilot = workspace.pilot;
  if (
    !pilot ||
    pilot.status !== "draft" ||
    !workspace.livePreview
  ) {
    return null;
  }

  return (
    <ProofSection
      id="baseline-preview"
      eyebrow="Baseline"
      title="Confirmă situația inițială"
      description="Previzualizarea este recalculată server-side. După confirmare, cohorta, criteriile și definiția devin imuabile."
    >
      <SnapshotSecondary snapshot={workspace.livePreview} />

      <div className={styles.confirmation}>
        <div className={styles.confirmationCopy}>
          <ShieldCheckIcon aria-hidden="true" />
          <div>
            <strong>Control uman înainte de înghețare</strong>
            <p>
              Verifică domeniul, cohorta, criteriile și limitările.
              Browserul nu definește snapshot-ul oficial.
            </p>
          </div>
        </div>

        {workspace.canManage ? (
          <form action={freezePilotBaseline} className={styles.confirmForm}>
            <input type="hidden" name="pilotId" value={pilot.id} />
            <label className={styles.inlineConfirmCheck}>
              <input
                required
                type="checkbox"
                name="confirm"
                value="yes"
              />
              <span>
                <strong>Am verificat baseline-ul</strong>
                <small>Domeniul, cohorta, criteriile și limitările.</small>
              </span>
            </label>
            <Button type="submit" className={styles.confirmationButton}>
              Confirmă și îngheață baseline-ul
            </Button>
          </form>
        ) : (
          <p className={styles.readOnlyNote}>
            Numai un proprietar, administrator sau manager poate
            îngheța baseline-ul.
          </p>
        )}
      </div>
    </ProofSection>
  );
}

function formatCriterionValue(
  value: number | null,
  unit: PilotCriterionEvaluation["unit"]
) {
  if (value === null) return "—";
  if (unit === "puncte procentuale") {
    return `${value.toFixed(1)}%`;
  }
  return value.toFixed(0);
}

function changeLabel(item: PilotCriterionEvaluation) {
  if (item.change === null) return "Date insuficiente";
  const sign = item.change > 0 ? "+" : "";
  if (item.unit === "puncte procentuale") {
    return `${sign}${item.change.toFixed(1)} pp`;
  }
  return `${sign}${item.change.toFixed(0)}`;
}

function ObservedChanges({
  comparison,
  preview
}: {
  comparison: PilotComparison;
  preview: boolean;
}) {
  const changes = comparison.criteria.slice(0, 5);

  return (
    <ProofSection
      id="comparatie"
      eyebrow={preview ? "Schimbare observată · previzualizare" : "Schimbare verificată"}
      title="Baseline → situația curentă"
      description={
        preview
          ? "Aceeași cohortă și aceeași definiție. Valorile devin oficiale numai după înghețarea situației finale."
          : "Comparație pe aceeași cohortă și aceeași definiție, fără a atribui automat cauzalitate."
      }
    >
      <div className={styles.changeRows}>
        {changes.map((item) => (
          <article key={item.id} className={styles.changeRow}>
            <div className={styles.changeIdentity}>
              <h3>{item.explanation}</h3>
              <span>
                Țintă · {item.targetValue}
                {item.unit === "puncte procentuale"
                  ? " pp"
                  : ""}
              </span>
            </div>

            <div className={styles.changeValues}>
              <span>
                <small>Baseline</small>
                <strong>
                  {formatCriterionValue(
                    item.baselineValue,
                    item.unit
                  )}
                </strong>
              </span>
              <i aria-hidden="true">→</i>
              <span>
                <small>{preview ? "Acum" : "Final"}</small>
                <strong>
                  {formatCriterionValue(
                    item.finalValue,
                    item.unit
                  )}
                </strong>
              </span>
            </div>

            <div className={styles.changeOutcome}>
              <strong>{changeLabel(item)}</strong>
              <span data-status={item.status}>
                {item.status === "met"
                  ? "Îndeplinit"
                  : item.status === "not_met"
                    ? "Neîndeplinit"
                    : "Date insuficiente"}
              </span>
            </div>
          </article>
        ))}
      </div>

      {preview ? (
        <p className={styles.previewBoundary}>
          Previzualizare · situația finală nu este încă înghețată.
        </p>
      ) : null}
    </ProofSection>
  );
}

function RecoveryProofSection({
  recoveryProof
}: {
  recoveryProof: PilotRecoveryProof | null;
}) {
  if (!recoveryProof) {
    return (
      <ProofSection
        eyebrow="Dovadă operațională"
        title="Istoricul verificabil nu este încă disponibil"
        description="Comparația pilotului rămâne validă; această zonă va afișa cazurile persistente când auditul Execution Integrity / Context Integrity este disponibil."
      >
        <p className={styles.quietText}>
          Nu completăm lipsurile cu estimări și nu inventăm
          rezolvări.
        </p>
      </ProofSection>
    );
  }

  return (
    <ProofSection
      id="dovada"
      eyebrow="Dovadă operațională"
      title="Ce a fost urmărit și închis în interval"
      description="Cazuri persistente din aceeași cohortă. Închiderea provine din schimbarea stării reale sau dintr-o decizie umană consemnată."
    >
      <dl className={styles.recoveryMetrics}>
        <div>
          <dt>Cazuri urmărite</dt>
          <dd>{recoveryProof.trackedCaseCount}</dd>
          <small>cu activitate în interval</small>
        </div>
        <div>
          <dt>Închise verificabil</dt>
          <dd>{recoveryProof.verifiedClosureCount}</dd>
          <small>
            {recoveryProof.sourceResolvedExecutionCount} execuție ·{" "}
            {recoveryProof.sourceResolvedContextCount} context prin sursă ·{" "}
            {recoveryProof.humanContextDecisionCount} decizii umane
          </small>
        </div>
        <div>
          <dt>Reapărute</dt>
          <dd>{recoveryProof.reopenedCount}</dd>
          <small>aceeași clasă de ruptură</small>
        </div>
        <div>
          <dt>Timp mediu până la închidere</dt>
          <dd>
            {durationLabel(recoveryProof.averageResolutionMinutes)}
          </dd>
          <small>cicluri cu început verificabil</small>
        </div>
      </dl>

      {recoveryProof.examples.length ? (
        <>
          <div className={styles.subsectionHeading}>
            <div>
              <p>Rezolvări recente</p>
              <h3>Dovada din spatele schimbării</h3>
            </div>
            <span>
              {recoveryProof.examples.length}{" "}
              {recoveryProof.examples.length === 1
                ? "exemplu"
                : "exemple"}
            </span>
          </div>
          <PilotVerifiedRecovery items={recoveryProof.examples} />
        </>
      ) : (
        <p className={styles.quietText}>
          Există activitate persistentă în cohortă, dar nu avem încă
          exemple de rezolvare care pot fi prezentate fără ambiguitate.
        </p>
      )}

      {recoveryProof.coverage === "partial" ? (
        <p className={styles.coverageNote}>
          Istoricul de dovadă este disponibil parțial. Metricile
          lipsă nu sunt completate prin inferență.
        </p>
      ) : null}
    </ProofSection>
  );
}

function CriteriaSection({
  comparison
}: {
  comparison: PilotComparison;
}) {
  return (
    <ProofSection
      eyebrow="Criterii"
      title="Ce a îndeplinit pilotul"
      description="Țintele au fost stabilite înainte de situația finală. Evaluarea este deterministă."
    >
      <div className={styles.criteriaRows}>
        {comparison.criteria.map((item) => (
          <article key={item.id} className={styles.criteriaRow}>
            <span
              className={styles.criteriaMark}
              data-status={item.status}
              aria-hidden="true"
            >
              {item.status === "met" ? <CheckIcon /> : null}
            </span>
            <div>
              <h3>{item.explanation}</h3>
              <p>
                {formatCriterionValue(item.baselineValue, item.unit)}
                <span aria-hidden="true"> → </span>
                {formatCriterionValue(item.finalValue, item.unit)}
                <span aria-hidden="true"> · </span>
                schimbare {changeLabel(item)}
              </p>
            </div>
            <strong data-status={item.status}>
              {item.status === "met"
                ? "Îndeplinit"
                : item.status === "not_met"
                  ? "Neîndeplinit"
                  : "Date insuficiente"}
            </strong>
          </article>
        ))}
      </div>
    </ProofSection>
  );
}

function FinancialBoundary({
  comparison,
  recoveryProof
}: {
  comparison: PilotComparison;
  recoveryProof: PilotRecoveryProof | null;
}) {
  return (
    <ProofSection
      eyebrow="Valoare"
      title="Estimarea și rezultatul rămân separate"
      description="Dovada operațională nu este transformată artificial în ROI sau venit recuperat."
    >
      <div className={styles.financialGrid}>
        <div>
          <span>Valoare estimată în cohortă</span>
          <CurrencyValues
            values={comparison.estimatedValueByCurrency}
            empty="Fără valoare estimată completă"
          />
          <p>
            Valoarea oportunităților din situația finală. Nu este
            venit confirmat.
          </p>
        </div>
        <div>
          <span>Valoare estimată asociată cazurilor urmărite</span>
          <CurrencyValues
            values={recoveryProof?.associatedValueByCurrency ?? []}
            empty="Fără valoare asociată disponibilă"
          />
          <p>
            Fiecare oportunitate este numărată o singură dată;
            monedele nu sunt cumulate.
          </p>
        </div>
        <div>
          <span>Venit confirmat</span>
          <CurrencyValues
            values={comparison.confirmedRevenueByCurrency}
            empty="Fără venit confirmat"
          />
          <p>
            Numai rezultate câștigate confirmate explicit de o
            persoană autorizată.
          </p>
        </div>
      </div>
      <p className={styles.moneyBoundary}>
        Închiderea unei rupturi comerciale demonstrează control
        operațional. Nu demonstrează singură că ReveNew a generat
        venit.
      </p>
    </ProofSection>
  );
}

function Limitations({
  comparison
}: {
  comparison: PilotComparison;
}) {
  return (
    <details className={styles.limitations}>
      <summary className="focus-ring">
        <span>
          <strong>Metodologie și limitări</strong>
          <small>
            Ce poate și ce nu poate fi concluzionat din acest pilot
          </small>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div>
        <ul>
          {comparison.limitations.map((item) => (
            <li key={item}>
              <ExclamationTriangleIcon aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          AI-ul nu confirmă rezultate și nu transformă estimările în
          venit. Decizia de continuare, ajustare sau oprire rămâne
          umană.
        </p>
      </div>
    </details>
  );
}

function FinalizePilot({
  workspace
}: {
  workspace: PilotMeasurementWorkspace;
}) {
  const pilot = workspace.pilot;
  if (
    !pilot ||
    pilot.status !== "active" ||
    !workspace.livePreview ||
    !workspace.canManage
  ) {
    return null;
  }

  return (
    <section className={styles.confirmationPanel}>
      <span className={styles.confirmationIcon} aria-hidden="true">
        <ShieldCheckIcon />
      </span>
      <div className={styles.confirmationText}>
        <p>Confirmare finală</p>
        <h2>Confirmă numai după ce ai verificat situația finală.</h2>
        <span>
          ReveNew recalculează snapshot-ul oficial pe server înainte
          de persistare. Bifează confirmarea doar dacă valorile și
          limitările afișate au fost revizuite.
        </span>
      </div>
      <form action={freezePilotFinal} className={styles.confirmationControls}>
        <input type="hidden" name="pilotId" value={pilot.id} />
        <label className={styles.confirmationCheck}>
          <input
            required
            type="checkbox"
            name="confirm"
            value="yes"
          />
          <span>
            <strong>Am verificat situația finală</strong>
            <small>Inclusiv limitările și valorile confirmate.</small>
          </span>
        </label>
        <Button type="submit" className={styles.confirmationButton}>
          Confirmă situația finală
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}

function ManagementDecision({
  workspace
}: {
  workspace: PilotMeasurementWorkspace;
}) {
  const pilot = workspace.pilot;
  if (!pilot) return null;

  if (pilot.status === "final_frozen" && workspace.canManage) {
    return (
      <section className={styles.confirmationPanel}>
        <span className={styles.confirmationIcon} aria-hidden="true">
          <LockClosedIcon />
        </span>
        <div className={styles.confirmationText}>
          <p>Decizie managerială</p>
          <h2>Închide pilotul numai după revizuirea dovezilor.</h2>
          <span>
            Închiderea păstrează contractul și ambele snapshot-uri
            read-only. Nu înseamnă automat continuare comercială și
            nu transformă estimările în venit.
          </span>
        </div>
        <form action={closePilotEngagement} className={styles.confirmationControls}>
          <input type="hidden" name="pilotId" value={pilot.id} />
          <label className={styles.confirmationCheck}>
            <input
              required
              type="checkbox"
              name="confirm"
              value="yes"
            />
            <span>
              <strong>Managementul a revizuit dovada</strong>
              <small>Criteriile, rezultatele și limitările pilotului.</small>
            </span>
          </label>
          <Button type="submit" className={styles.confirmationButton}>
            Închide pilotul
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </form>
      </section>
    );
  }

  if (pilot.status === "closed") {
    return (
      <section className={styles.nextStep}>
        <div>
          <p>Decizie managerială</p>
          <h2>Ce facem cu această dovadă?</h2>
          <span>
            O continuare este justificată numai dacă echipa consideră
            util controlul operațional recurent.
          </span>
        </div>
        <div className={styles.nextStepActions}>
          <Button
            href="/reports/enterprise-pilot-pack"
            variant="secondary"
          >
            Evaluează continuarea
          </Button>
          <Link
            href="/reports"
            className={`focus-ring ${styles.textAction}`}
          >
            Înapoi la rapoarte
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return null;
}

function MetricUnitGuide() {
  return (
    <details className={styles.unitGuide}>
      <summary className="focus-ring">
        <InformationCircleIcon aria-hidden="true" />
        <span>Ce înseamnă unitățile?</span>
      </summary>
      <div className={styles.unitGuidePanel}>
        <div>
          <strong>pp</strong>
          <p>
            Puncte procentuale. Măsoară diferența dintre procentul
            de la baseline și procentul final. Exemplu: 60% → 80%
            înseamnă +20 pp.
          </p>
        </div>
        <div>
          <strong>cazuri</strong>
          <p>
            Numărul absolut de oportunități din cohortă pentru care
            se urmărește o reducere. Exemplu: 6 follow-up-uri restante
            → 3 înseamnă o reducere de 3 cazuri.
          </p>
        </div>
        <div>
          <strong>înregistrări</strong>
          <p>
            Numărul de acțiuni finalizate consemnate în intervalul
            pilotului pentru oportunitățile din cohortă. Nu este un
            număr de oportunități și nu reprezintă venit.
          </p>
        </div>
        <p className={styles.unitGuideSource}>
          Unitățile provin din definiția de măsurare
          commercial-state-v1 și sunt comparate între baseline și
          situația finală.
        </p>
      </div>
    </details>
  );
}

function Setup({
  workspace
}: {
  workspace: PilotMeasurementWorkspace;
}) {
  const today = new Date();
  const end = new Date(today.getTime() + 14 * 86_400_000);
  const date = (value: Date) => value.toISOString().slice(0, 10);

  return (
    <form action={createPilotEngagement} className={styles.setup}>
      <section className={styles.setupSection}>
        <div className={styles.setupIndex}>01</div>
        <div className={styles.setupContent}>
          <header>
            <p>Definire</p>
            <h2>Un singur proces. O perioadă clară.</h2>
            <span>
              Completează numai datele care definesc pilotul. După
              înghețarea baseline-ului, cohorta și regulile de
              măsurare nu mai pot fi schimbate.
            </span>
          </header>

          <div className={styles.fieldGrid}>
            <label>
              <span>Nume pilot</span>
              <input
                name="name"
                required
                minLength={3}
                defaultValue="Pilot de execuție comercială"
                className="field"
              />
            </label>
            <label>
              <span>Nume afișat clientului</span>
              <input
                name="customerFacingName"
                required
                minLength={2}
                defaultValue={workspace.workspaceName}
                className="field"
              />
            </label>
            <label>
              <span>Data începerii</span>
              <input
                name="startsOn"
                type="date"
                required
                defaultValue={date(today)}
                className="field"
              />
            </label>
            <label>
              <span>Data estimată a încheierii</span>
              <input
                name="expectedEndsOn"
                type="date"
                required
                defaultValue={date(end)}
                className="field"
              />
            </label>
            <label className={styles.fullField}>
              <span>Domeniul controlat</span>
              <textarea
                name="scopeNote"
                required
                minLength={3}
                rows={3}
                defaultValue="Oportunități selectate pentru verificarea responsabilității, acțiunilor următoare și follow-up-urilor întârziate."
                className="field"
              />
            </label>
          </div>
        </div>
      </section>

      <section className={styles.setupSection}>
        <div className={styles.setupIndex}>02</div>
        <div className={styles.setupContent}>
          <header className={styles.setupHeaderWithMeta}>
            <div>
              <p>Cohortă</p>
              <h2>Aceleași oportunități de la început până la final.</h2>
              <span>
                Selectează lotul comparabil. Pentru un pilot relevant,
                20–50 de oportunități sunt de regulă suficiente.
              </span>
            </div>
            <strong>
              {workspace.candidates.filter((item) => item.active).length}{" "}
              selectate inițial
            </strong>
          </header>

          <fieldset className={styles.cohort}>
            <legend className="sr-only">Cohorta pilotului</legend>
            {workspace.candidates.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  name="cohort"
                  value={item.id}
                  defaultChecked={item.active}
                />
                <span className={styles.checkboxVisual} aria-hidden="true" />
                <span className={styles.candidateCopy}>
                  <strong>{item.title}</strong>
                  <small>
                    {item.company}
                    <span aria-hidden="true"> · </span>
                    {item.estimatedValue > 0
                      ? formatCurrency(
                          item.estimatedValue,
                          item.currency
                        )
                      : "valoare neconfirmată"}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <section className={styles.setupSection}>
        <div className={styles.setupIndex}>03</div>
        <div className={styles.setupContent}>
          <header className={styles.criteriaHeader}>
            <div>
              <p>Criterii</p>
              <h2>Succesul este definit înainte să vedem rezultatul.</h2>
              <span>
                Fiecare țintă spune exact ce schimbare trebuie
                observată în aceeași cohortă. Nu sunt obiective de
                venit și nu sunt scoruri AI.
              </span>
            </div>
            <MetricUnitGuide />
          </header>

          <fieldset className={styles.criteriaSetup}>
            <legend className="sr-only">Criterii de succes</legend>
            {[
              {
                key: "owner_coverage_pp",
                label: "Acoperire cu responsabil",
                description:
                  "Diferența dintre procentul oportunităților cu responsabil la baseline și la final.",
                target: 20,
                unit: "pp"
              },
              {
                key: "next_action_coverage_pp",
                label: "Acoperire cu următor pas",
                description:
                  "Diferența dintre procentul oportunităților cu un următor pas definit la baseline și la final.",
                target: 20,
                unit: "pp"
              },
              {
                key: "overdue_followups_reduction",
                label: "Reducere follow-up-uri restante",
                description:
                  "Cu câte oportunități scade numărul celor care au următorul pas restant.",
                target: 3,
                unit: "cazuri"
              },
              {
                key: "stale_opportunities_reduction",
                label: "Reducere oportunități inactive",
                description:
                  "Cu câte oportunități scade numărul celor fără activitate relevantă peste pragul pilotului.",
                target: 2,
                unit: "cazuri"
              },
              {
                key: "actions_completed",
                label: "Acțiuni finalizate",
                description:
                  "Creșterea numărului de acțiuni finalizate și consemnate pentru cohortă în intervalul pilotului.",
                target: 5,
                unit: "înregistrări"
              }
            ].map((criterion) => (
              <label key={criterion.key}>
                <input
                  type="checkbox"
                  name={`criterion_${criterion.key}`}
                  defaultChecked
                />
                <span className={styles.checkboxVisual} aria-hidden="true" />
                <span className={styles.criterionSetupCopy}>
                  <strong>{criterion.label}</strong>
                  <small>{criterion.description}</small>
                </span>
                <span className={styles.target}>
                  <input
                    aria-label={`Țintă ${criterion.label}`}
                    name={`target_${criterion.key}`}
                    type="number"
                    min="0"
                    max="1000"
                    defaultValue={criterion.target}
                  />
                  <span>{criterion.unit}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <footer className={styles.setupFooter}>
        <div>
          <ShieldCheckIcon aria-hidden="true" />
          <p>
            Control uman obligatoriu. Pilotul nu trimite automat
            mesaje, nu confirmă venit și nu modifică rezultatele.
          </p>
        </div>
        {workspace.canManage ? (
          <Button type="submit" size="large">
            Creează pilotul
          </Button>
        ) : (
          <span className={styles.readOnlyNote}>
            Ai acces de consultare. Crearea necesită rol managerial.
          </span>
        )}
      </footer>
    </form>
  );
}

export function PilotProofOfValueExperience({
  workspace,
  comparison,
  recoveryProof
}: {
  workspace: PilotMeasurementWorkspace;
  comparison: PilotComparison | null;
  recoveryProof: PilotRecoveryProof | null;
}) {
  const pilot = workspace.pilot;
  const preview =
    Boolean(comparison) && !Boolean(workspace.final);

  const actions = (
    <div className={styles.pageActions}>
      {pilot && ["closed", "cancelled"].includes(pilot.status) ? (
        <Button
          href="/reports/pilot-proof-of-value?pilot=new"
          variant="secondary"
          size="small"
        >
          Pilot nou
        </Button>
      ) : null}
      <Button
        href="/reports/enterprise-pilot-pack"
        variant="secondary"
        size="small"
      >
        Propunere pilot
      </Button>
      {workspace.final ? <PrintProofOfValueButton /> : null}
    </div>
  );

  return (
    <PageShell
      wide
      eyebrow="Pilot controlat"
      title="Dovadă de valoare"
      description="Măsurare verificabilă pe aceeași cohortă, de la baseline la situația finală — fără ROI inventat și fără a confunda estimarea cu venitul."
      breadcrumbs={[
        { label: "Rapoarte", href: "/reports" },
        { label: "Dovadă de valoare" }
      ]}
      actions={actions}
    >
      <div className={styles.root}>
        <StageRail
          status={pilot?.status}
          hasBaseline={Boolean(workspace.baseline)}
          hasFinal={Boolean(workspace.final)}
        />

        {!workspace.available ? (
          <section className={styles.statePanel}>
            <p>Mediu indisponibil</p>
            <h2>Modelul persistent al pilotului nu este disponibil.</h2>
            <span>
              {workspace.error ??
                "Este necesar mediul Supabase autorizat pentru un pilot verificabil."}
            </span>
          </section>
        ) : null}

        {workspace.available && !pilot ? (
          <>
            <section className={styles.intro}>
              <div>
                <p>Dovadă înainte de promisiune</p>
                <h2>Începe cu un singur proces comercial.</h2>
                <span>
                  Fixăm cohorta și criteriile, observăm 14 zile,
                  apoi comparăm aceeași realitate. Fără schimbarea
                  regulilor după ce vedem rezultatul.
                </span>
              </div>
              <div className={styles.introPrinciple}>
                <strong>Baseline → Execuție → Dovadă → Decizie</strong>
                <span>
                  ReveNew măsoară controlul operațional. Managementul
                  decide ce urmează.
                </span>
              </div>
            </section>
            <Setup workspace={workspace} />
          </>
        ) : null}

        {pilot ? (
          <>
            <PilotHero
              workspace={workspace}
              comparison={comparison}
              recoveryProof={recoveryProof}
            />

            {pilot.status === "cancelled" ? (
              <section className={styles.statePanel}>
                <p>Pilot anulat</p>
                <h2>Nu există o dovadă finală de valoare.</h2>
                <span>
                  Motiv consemnat:{" "}
                  {pilot.cancellationReason ?? "nespecificat"}.
                  Baseline-ul existent rămâne disponibil pentru audit.
                </span>
              </section>
            ) : null}

            <BaselineReference workspace={workspace} />

            <BaselineConfirmation workspace={workspace} />

            {comparison && pilot.status !== "cancelled" ? (
              <ObservedChanges
                comparison={comparison}
                preview={preview}
              />
            ) : null}

            {workspace.baseline &&
            pilot.status !== "draft" &&
            pilot.status !== "cancelled" ? (
              <RecoveryProofSection recoveryProof={recoveryProof} />
            ) : null}

            {workspace.final &&
            workspace.comparison &&
            pilot.status !== "cancelled" ? (
              <>
                <CriteriaSection comparison={workspace.comparison} />
                <FinancialBoundary
                  comparison={workspace.comparison}
                  recoveryProof={recoveryProof}
                />
                <Limitations comparison={workspace.comparison} />
              </>
            ) : null}

            <FinalizePilot workspace={workspace} />
            <ManagementDecision workspace={workspace} />
          </>
        ) : null}

        <footer className={styles.trustFooter}>
          <ShieldCheckIcon aria-hidden="true" />
          <p>
            Valorile estimate, schimbarea operațională și venitul
            confirmat sunt concepte distincte. AI-ul nu confirmă
            rezultatele pilotului. Decizia finală rămâne umană.
          </p>
        </footer>
      </div>
    </PageShell>
  );
}
