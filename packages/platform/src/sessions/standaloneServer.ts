import { join } from "node:path"
import { parse } from "yaml"
import { parseConnection } from "../infobases/parseConnection"
import {
  buildStandaloneConfigExport,
  buildStandaloneConfigInit,
} from "./commands"
import { PlatformSessionError } from "./errors"
import type { SessionProcessRuntime } from "./runtime"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

export interface StandaloneServerDependencies {
  fileSystem: {
    mkdir(path: string): Promise<void>
    writeFile(path: string, content: string): Promise<void>
  }
  processRuntime: Pick<SessionProcessRuntime, "run">
  commandTimeoutMs: number
}

export async function createStandaloneServerSession(
  params: CreatePlatformSessionParams,
  dependencies: StandaloneServerDependencies
): Promise<PlatformSession> {
  const ibcmdPath = params.installation.ibcmdPath
  if (ibcmdPath === undefined) {
    throw missingComponent("ibcmd")
  }
  const connection = parseConnection(params.settings.connectionString)
  if (connection.type !== "file") {
    throw new PlatformSessionError(
      "unsupported_connection",
      "Автономный сервер поддерживает только файловую информационную базу"
    )
  }

  const configPath = join(params.sessionDir, "config.yaml")
  await dependencies.fileSystem.mkdir(params.sessionDir)

  const init = buildStandaloneConfigInit({
    ibcmdPath,
    databasePath: connection.path,
  })
  const initialized = await dependencies.processRuntime.run(init.command, init.args, {
    timeoutMs: dependencies.commandTimeoutMs,
  })
  if (initialized.timedOut === true) {
    throw new PlatformSessionError(
      "session_timeout",
      "Истекло время подготовки конфигурации ibcmd"
    )
  }
  if (initialized.exitCode !== 0) {
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd не смог подготовить конфигурацию автономного сервера"
    )
  }
  validateConfiguration(initialized.stdout)
  await dependencies.fileSystem.writeFile(configPath, initialized.stdout)

  let closed = false
  return {
    mode: "standalone-server",
    ownedProcess: false,
    isAlive() {
      return !closed
    },
    async exportConfiguration(outputDir, operationLogPath) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const command = buildStandaloneConfigExport({
        ibcmdPath,
        configPath,
        outputDir,
        ...(params.settings.user === undefined ? {} : { user: params.settings.user }),
        ...(params.settings.password === undefined
          ? {}
          : { password: params.settings.password }),
      })
      const exported = await dependencies.processRuntime.run(command.command, command.args, {
        timeoutMs: dependencies.commandTimeoutMs,
      })
      if (exported.timedOut === true) {
        throw new PlatformSessionError(
          "session_timeout",
          "Истекло время выгрузки конфигурации через ibcmd"
        )
      }
      if (exported.exitCode !== 0) {
        throw new PlatformSessionError(
          "platform_command_failed",
          "ibcmd не смог выгрузить конфигурацию в XML"
        )
      }
      try {
        await dependencies.fileSystem.writeFile(
          operationLogPath,
          "Конфигурация выгружена через автономный сервер\n"
        )
      } catch {
        throw new PlatformSessionError(
          "platform_command_failed",
          "Не удалось записать журнал операции платформы"
        )
      }
    },
    async close() {
      if (closed) return { stoppedOwnedProcess: false }
      closed = true
      return { stoppedOwnedProcess: false }
    },
  }
}

function missingComponent(name: string): PlatformSessionError {
  return new PlatformSessionError(
    "platform_component_missing",
    `В установке платформы 8.3.27 не найден ${name}`
  )
}

function validateConfiguration(source: string): void {
  try {
    if (!isRecord(parse(source))) throw new Error("configuration is not an object")
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd вернул некорректную конфигурацию автономного сервера"
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
