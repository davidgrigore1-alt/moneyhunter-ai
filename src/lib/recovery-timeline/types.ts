export type RecoveryTimelineDomain =
  | "execution"
  | "context_integrity";

export type RecoveryTimelineStatus =
  | "open"
  | "reopened"
  | "resolved";

export type RecoveryTimelineEvidenceKind =
  | "source"
  | "resolution"
  | "audit";

export type RecoveryTimelineEvidence = {
  id: string;
  kind: RecoveryTimelineEvidenceKind;
  sourceType: string;
  label: string;
  observedAt: string | null;
  href: string;
  actorLabel: string | null;
};

export type RecoveryTimelineLifecycleStep = {
  id: string;
  kind:
    | "detected"
    | "changed"
    | "reopened"
    | "decision"
    | "resolved";
  label: string;
  at: string;
  actorLabel: string | null;
};

export type RecoveryTimelineItem = {
  id: string;
  domain: RecoveryTimelineDomain;
  caseKey: string;
  findingKey: string;
  status: RecoveryTimelineStatus;
  severity: "critical" | "high" | "attention" | "review";
  code: string;
  title: string;
  description: string;
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  ownerName: string;
  estimatedValue: number | null;
  currency: string;
  firstDetectedAt: string;
  lastDetectedAt: string;
  lastEvaluatedAt: string;
  resolvedAt: string | null;
  ageDays: number;
  durationMinutes: number | null;
  resolutionSummary: string | null;
  resolutionNote: string | null;
  resolutionActorLabel: string | null;
  safeActionLabel: string;
  safeActionHref: string;
  evidence: RecoveryTimelineEvidence[];
  lifecycle: RecoveryTimelineLifecycleStep[];
};

export type RecoveryTimelineValueMetric = {
  currency: string;
  amount: number;
};

export type RecoveryTimelineModel = {
  windowDays: number;
  generatedAt: string;
  openCount: number;
  reopenedCount: number;
  resolvedCount: number;
  averageResolutionMinutes: number | null;
  valueAssociated: RecoveryTimelineValueMetric[];
  items: RecoveryTimelineItem[];
  coverage: "complete" | "partial";
};
