import type { PlatformInstallation } from "../platform/findPlatform"
import type { ConfigurationExtensionInfo } from "../extensions/types"
import type { PlatformOperationLog } from "./runtime"

export type PlatformSessionMode = "designer-agent" | "standalone-server"
export type PartialLoadMode = "partial" | "selected"

export type UnresolvedReferencesMode = "include" | "omit"

export type InfobaseImportSettings = {
  mode: PlatformSessionMode
  unresolvedReferences: UnresolvedReferencesMode
}

export type DatabaseManagementSystem = "MSSQLServer" | "PostgreSQL" | "IBMDB2" | "OracleDatabase"

export type DatabaseConnectionSettings = {
  dbms: DatabaseManagementSystem
  server: string
  name: string
  user?: string
  password?: string
}

export type NormalizedPlatformConnectionSettings = {
  connectionString: string
  user?: string
  password?: string
  sessionIdleTimeout: number
  database?: DatabaseConnectionSettings
}

export type ExportConfigurationParams = NormalizedPlatformConnectionSettings & {
  projectDir: string
  outputDir: string
  logPath: string
  mode: PlatformSessionMode
  unresolvedReferences: UnresolvedReferencesMode
  extensionName?: string
  signal?: AbortSignal
}

export type ExportConfigurationResult = {
  mode: PlatformSessionMode
  reusedConnection: boolean
}

export type ListConfigurationExtensionsParams = NormalizedPlatformConnectionSettings & {
  projectDir: string
  mode: PlatformSessionMode
  signal?: AbortSignal
}

export type ListConfigurationExtensionsResult = {
  extensions: ConfigurationExtensionInfo[]
  mode: PlatformSessionMode
  reusedConnection: boolean
}

export type LoadPartialConfigurationParams = NormalizedPlatformConnectionSettings & {
  mode: PlatformSessionMode
  projectDir: string
  archivePath: string
  loadTargets: readonly string[]
  logPath: string
  extensionName?: string
  signal?: AbortSignal
}

export type LoadPartialConfigurationResult = {
  mode: PlatformSessionMode
  loadMode: PartialLoadMode
  reusedConnection: boolean
  warnings: readonly string[]
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
  infobase: NormalizedPlatformConnectionSettings & {
    operations: { import: InfobaseImportSettings }
  }
}

export interface PlatformSession {
  mode: PlatformSessionMode
  ownedProcess: boolean
  exportConfiguration(
    outputDir: string,
    operationLog: PlatformOperationLog,
    unresolvedReferences: UnresolvedReferencesMode,
    signal?: AbortSignal,
    extensionName?: string
  ): Promise<void>
  listExtensions(signal?: AbortSignal): Promise<ConfigurationExtensionInfo[]>
  loadPartialConfiguration?(
    archivePath: string,
    loadTargets: readonly string[],
    operationLog: PlatformOperationLog,
    extensionName?: string,
    signal?: AbortSignal
  ): Promise<{ warnings: readonly string[]; loadMode: PartialLoadMode }>
  isAlive(): boolean
  close(): Promise<{ stoppedOwnedProcess: boolean }>
  cancel(): Promise<{ stoppedOwnedProcess: boolean }>
}

export type CreatePlatformSessionParams = {
  projectDir: string
  sessionDir: string
  installation: PlatformInstallation
  settings: NormalizedPlatformConnectionSettings
  operationLog?: PlatformOperationLog
}

export interface PlatformSessionManager {
  exportConfiguration(params: ExportConfigurationParams): Promise<ExportConfigurationResult>
  listExtensions(params: ListConfigurationExtensionsParams): Promise<ListConfigurationExtensionsResult>
  loadPartialConfiguration(params: LoadPartialConfigurationParams): Promise<LoadPartialConfigurationResult>
  closeConnection(projectDir: string): Promise<CloseConnectionResult>
  closeAllConnections(): Promise<CloseAllConnectionsResult>
}
