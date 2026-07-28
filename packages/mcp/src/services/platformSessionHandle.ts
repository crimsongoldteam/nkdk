import {
  createPlatformSessionManager,
  type CloseAllConnectionsResult,
  type PlatformSessionManager,
} from "@nkdk/platform"

let managerFactory: () => PlatformSessionManager = createPlatformSessionManager
let handle: PlatformSessionManager | undefined

export function getPlatformSessionManager(): PlatformSessionManager {
  return (handle ??= managerFactory())
}

export async function closePlatformSessionManager(): Promise<CloseAllConnectionsResult> {
  if (handle === undefined) return { closedCount: 0, stoppedOwnedProcesses: 0 }
  const current = handle
  handle = undefined
  return current.closeAllConnections()
}

export function setPlatformSessionManagerFactoryForTests(
  factory: () => PlatformSessionManager
): () => void {
  const previousFactory = managerFactory
  handle = undefined
  managerFactory = factory
  return () => {
    handle = undefined
    managerFactory = previousFactory
  }
}
