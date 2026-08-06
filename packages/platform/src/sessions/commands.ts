import type { InfobaseConnection } from "../infobases/types"
import { PlatformSessionError } from "./errors"
import type { ProcessLaunch } from "./runtime"
import type { DatabaseConnectionSettings, UnresolvedReferencesMode } from "./types"

export function buildDesignerAgentLaunch(params: {
  enterprisePath: string
  connection: InfobaseConnection
  hostKeyPath: string
  baseDir: string
  logPath: string
  port: number
}): ProcessLaunch {
  return {
    command: params.enterprisePath,
    args: [
      "DESIGNER",
      designerConnectionArgument(params.connection),
      "/AgentMode",
      "/AgentSSHHostKey",
      params.hostKeyPath,
      "/AgentBaseDir",
      params.baseDir,
      "/AppAutoCheckVersion-",
      "/AgentPort",
      String(params.port),
      "/Out",
      params.logPath,
    ],
  }
}

export function buildStandaloneConfigInit(
  params: { ibcmdPath: string } & (
    | { databasePath: string; database?: never }
    | { database: DatabaseConnectionSettings; databasePath?: never }
  )
): ProcessLaunch {
  const databaseArguments =
    params.database === undefined
      ? [`--database-path=${params.databasePath}`]
      : [
          `--dbms=${params.database.dbms}`,
          `--database-server=${params.database.server}`,
          `--database-name=${params.database.name}`,
          ...(params.database.user === undefined
            ? []
            : [`--database-user=${params.database.user}`]),
          ...(params.database.password === undefined
            ? []
            : [`--database-password=${params.database.password}`]),
        ]
  return {
    command: params.ibcmdPath,
    args: ["server", "config", "init", ...databaseArguments],
  }
}

export function buildStandaloneConfigExport(params: {
  ibcmdPath: string
  configPath: string
  outputDir: string
  user?: string
  password?: string
  unresolvedReferences: UnresolvedReferencesMode
}): ProcessLaunch {
  return {
    command: params.ibcmdPath,
    args: [
      "infobase",
      "config",
      "export",
      ...(params.user === undefined ? [] : [`--user=${params.user}`]),
      ...(params.password === undefined ? [] : [`--password=${params.password}`]),
      ...(params.unresolvedReferences === "omit" ? ["--ignore-unresolved-refs"] : []),
      `--config=${params.configPath}`,
      params.outputDir,
    ],
  }
}

export function buildStandaloneListExtensions(params: {
  ibcmdPath: string
  configPath: string
  user?: string
  password?: string
}): ProcessLaunch {
  return {
    command: params.ibcmdPath,
    args: [
      "infobase",
      "config",
      "extension",
      "list",
      ...(params.user === undefined ? [] : [`--user=${params.user}`]),
      ...(params.password === undefined ? [] : [`--password=${params.password}`]),
      `--config=${params.configPath}`,
    ],
  }
}

export function buildStandaloneLaunch(params: {
  ibsrvPath: string
  dataDir: string
  sessionDataDir: string
  configPath: string
}): ProcessLaunch {
  return {
    command: params.ibsrvPath,
    args: [
      "--data",
      params.dataDir,
      "--session-data",
      params.sessionDataDir,
      "--config",
      params.configPath,
    ],
  }
}

export function buildDumpConfigurationCommand(
  outputDir: string,
  unresolvedReferences: UnresolvedReferencesMode
): string {
  return [
    `config dump-config-to-files --dir="${interactiveValue(outputDir)}"`,
    "--format=hierarchical",
    ...(unresolvedReferences === "omit" ? ["--ignore-unresolved-refs"] : []),
  ].join(" ")
}

export function buildListDesignerExtensionsCommand(): string {
  return "config extensions properties get --all-extensions"
}

function designerConnectionArgument(connection: InfobaseConnection): string {
  if (connection.type === "file") return `/F${connection.path}`
  if (connection.type === "server") return `/S${connection.server}\\${connection.reference}`
  throw new PlatformSessionError(
    "unsupported_connection",
    "Агент Конфигуратора поддерживает только файловые и клиент-серверные информационные базы"
  )
}

function interactiveValue(value: string): string {
  if (value.includes("\0") || value.includes("\n") || value.includes("\r")) {
    throw new PlatformSessionError(
      "platform_command_failed",
      "Значение команды платформы содержит недопустимые символы"
    )
  }
  return value.replaceAll('"', '""')
}
