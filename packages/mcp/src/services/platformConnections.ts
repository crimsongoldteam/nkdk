import type { PlatformSessionManager } from "@nkdk/platform"
import type { ClosePlatformConnectionInput } from "../contracts/platformConnections"
import { toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { getPlatformSessionManager } from "./platformSessionHandle"

export interface PlatformConnectionsDependencies {
  manager: PlatformSessionManager
}

export async function closePlatformConnection(
  input: ClosePlatformConnectionInput,
  dependencies: PlatformConnectionsDependencies = {
    manager: getPlatformSessionManager(),
  }
): Promise<
  ToolPayload<{
    closed: boolean
    stoppedOwnedProcess: boolean
  }>
> {
  try {
    return toolSuccess(await dependencies.manager.closeConnection(input.projectDir))
  } catch {
    return toolError("core_error", "Не удалось закрыть соединение с платформой")
  }
}

export async function closeAllPlatformConnections(
  dependencies: PlatformConnectionsDependencies = {
    manager: getPlatformSessionManager(),
  }
): Promise<
  ToolPayload<{
    closedCount: number
    stoppedOwnedProcesses: number
  }>
> {
  try {
    return toolSuccess(await dependencies.manager.closeAllConnections())
  } catch {
    return toolError("core_error", "Не удалось закрыть соединения с платформой")
  }
}
