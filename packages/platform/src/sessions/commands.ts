import type { InfobaseConnection } from "../infobases/types"
import { PlatformSessionError } from "./errors"

export type ProcessLaunch = {
  command: string
  args: string[]
}

export function buildDesignerAgentLaunch(params: {
  enterprisePath: string
  connection: InfobaseConnection
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
      "/AgentSSHHostKeyAuto",
      "/AgentBaseDir",
      params.baseDir,
      "/AppAutoCheckVersion-",
      "/AgentPort",
      String(params.port),
      "/Out",
      params.logPath,
      "-NoTruncate",
    ],
  }
}

export function buildStandaloneConfigInit(params: {
  ibcmdPath: string
  databasePath: string
}): ProcessLaunch {
  return {
    command: params.ibcmdPath,
    args: ["server", "config", "init", `--database-path=${params.databasePath}`],
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

export function buildDumpConfigurationCommand(outputDir: string): string {
  return `config dump-config-to-files --dir="${interactiveValue(outputDir)}" --format=hierarchical`
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
