import { PilotProofOfValueExperience } from "@/components/reports/PilotProofOfValueExperience";
import {
  getPilotMeasurementWorkspace,
  pilotContract
} from "@/lib/pilot-measurement";
import { comparePilotSnapshots } from "@/lib/pilot-measurement-core";
import { getPilotRecoveryProof } from "@/lib/pilot-proof-recovery";

export const dynamic = "force-dynamic";

export default async function PilotProofOfValuePage(props: {
  searchParams?: Promise<{ pilot?: string }>;
}) {
  const searchParams = await props.searchParams;
  const workspace = await getPilotMeasurementWorkspace(
    searchParams?.pilot
  );
  const pilot = workspace.pilot;

  const previewComparison =
    pilot &&
    workspace.baseline &&
    workspace.livePreview?.snapshotKind === "final"
      ? comparePilotSnapshots(
          pilotContract(pilot),
          workspace.baseline.snapshot_payload,
          workspace.livePreview
        )
      : null;

  const comparison = workspace.comparison ?? previewComparison;

  const proofSnapshot =
    workspace.final?.snapshot_payload ??
    workspace.livePreview ??
    workspace.baseline?.snapshot_payload ??
    null;

  const proofStartAt = workspace.baseline?.captured_at ?? null;
  const proofEndAt =
    workspace.final?.captured_at ??
    workspace.livePreview?.capturedAt ??
    null;

  const recoveryProof =
    pilot &&
    proofSnapshot &&
    proofStartAt &&
    proofEndAt &&
    pilot.status !== "draft" &&
    pilot.status !== "cancelled"
      ? await getPilotRecoveryProof({
          pilot,
          snapshot: proofSnapshot,
          startAt: proofStartAt,
          endAt: proofEndAt
        }).catch(() => null)
      : null;

  return (
    <PilotProofOfValueExperience
      workspace={workspace}
      comparison={comparison}
      recoveryProof={recoveryProof}
    />
  );
}
