import type {
  PlatformCommandConnectionStage,
  PlatformCommandConnectionStatus,
} from "../sessions/sshProtocol"

type StageListener = (
  stage: PlatformCommandConnectionStage,
  status: PlatformCommandConnectionStatus
) => Promise<void>

export async function simulatePlatformConnectionStages(
  onStage: StageListener | undefined,
  failure?: { stage: PlatformCommandConnectionStage; error: Error }
): Promise<void> {
  await onStage?.("protocol-handshake", "start")
  if (failure?.stage === "protocol-handshake") throw failure.error
  await onStage?.("protocol-handshake", "ready")
  await onStage?.("authentication", "start")
  if (failure?.stage === "authentication") throw failure.error
  await onStage?.("authentication", "ready")
}
