import type { PlatformInstallation } from "../platform/findPlatform"

export type PlatformSessionMode = "designer-agent" | "standalone-server"

export type PlatformConnectionSettings = {
  connectionString: string
  user?: string
  password?: string
  useStandaloneServer?: boolean
  sessionIdleTimeout?: number
}

export type NormalizedPlatformConnectionSettings = Required<
  Pick<PlatformConnectionSettings, "connectionString" | "useStandaloneServer" | "sessionIdleTimeout">
> &
  Pick<PlatformConnectionSettings, "user" | "password">

export type ExportConfigurationParams = PlatformConnectionSettings & {
  projectDir: string
  outputDir: string
  logPath: string
}

export type ExportConfigurationResult = {
  mode: PlatformSessionMode
  reusedConnection: boolean
}

export type CloseConnectionResult = {
  closed: boolean
  stoppedOwnedProcess: boolean
}

export type CloseAllConnectionsResult = {
  closedCount: number
  stoppedOwnedProcesses: number
}

export type ProjectSettings = {
  version: 1
  infobase: NormalizedPlatformConnectionSettings
}

export interface PlatformSession {
  mode: PlatformSessionMode
  ownedProcess: boolean
  exportConfiguration(outputDir: string, operationLogPath: string): Promise<void>
  isAlive(): boolean
  close(): Promise<{ stoppedOwnedProcess: boolean }>
}

export type CreatePlatformSessionParams = {
  projectDir: string
  sessionDir: string
  installation: PlatformInstallation
  settings: NormalizedPlatformConnectionSettings
}

export interface PlatformSessionManager {
  exportConfiguration(params: ExportConfigurationParams): Promise<ExportConfigurationResult>
  closeConnection(projectDir: string): Promise<CloseConnectionResult>
  closeAllConnections(): Promise<CloseAllConnectionsResult>
}
