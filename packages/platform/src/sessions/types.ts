import type { PlatformInstallation } from "../platform/findPlatform"

export type PlatformSessionMode = "designer-agent" | "standalone-server"

export type DatabaseManagementSystem =
  | "MSSQLServer"
  | "PostgreSQL"
  | "IBMDB2"
  | "OracleDatabase"

export type DatabaseConnectionSettings = {
  dbms: DatabaseManagementSystem
  server: string
  name: string
  user: string
  password?: string
}

export type PlatformConnectionSettings = {
  connectionString: string
  user?: string
  password?: string
  useStandaloneServer?: boolean
  sessionIdleTimeout?: number
  database?: DatabaseConnectionSettings
}

export type NormalizedPlatformConnectionSettings = Required<
  Pick<PlatformConnectionSettings, "connectionString" | "useStandaloneServer" | "sessionIdleTimeout">
> &
  Pick<PlatformConnectionSettings, "user" | "password" | "database">

export type ExportConfigurationParams = PlatformConnectionSettings & {
  projectDir: string
  outputDir: string
  logPath: string
  signal?: AbortSignal
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
  exportConfiguration(
    outputDir: string,
    operationLogPath: string,
    signal?: AbortSignal
  ): Promise<void>
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
