import { join } from "node:path"
import { parse } from "yaml"
import { parseIbcmdExtensionList } from "../extensions/parse"
import { parseConnection } from "../infobases/parseConnection"
import {
  buildStandaloneConfigExport,
  buildStandaloneConfigInit,
  buildStandaloneListExtensions,
} from "./commands"
import { PlatformSessionError } from "./errors"
import type { SessionProcessRuntime } from "./runtime"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

const PRIVATE_FILE_MODE = 0o600

export interface StandaloneServerDependencies {
  fileSystem: {
    mkdir(path: string): Promise<void>
    writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
    chmod(path: string, mode: number): Promise<void>
    rm(path: string): Promise<void>
  }
  processRuntime: Pick<SessionProcessRuntime, "run">
  commandTimeoutMs: number
  closeTimeoutMs: number
  platform: NodeJS.Platform
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
  if (connection.type !== "file" && connection.type !== "server") {
    throw new PlatformSessionError(
      "unsupported_connection",
      "Offline-режим ibcmd поддерживает только файловые и клиент-серверные базы"
    )
  }
  const database = params.settings.database

  const configPath = join(params.sessionDir, "config.yaml")
  let init
  if (connection.type === "file") {
    init = buildStandaloneConfigInit({
      ibcmdPath,
      databasePath: connection.path,
    })
  } else {
    if (database === undefined) {
      throw new PlatformSessionError(
        "invalid_project_settings",
        "Для offline-доступа к клиент-серверной базе нужны параметры СУБД"
      )
    }
    init = buildStandaloneConfigInit({ ibcmdPath, database })
  }
  await dependencies.fileSystem.mkdir(params.sessionDir)
  try {
    await dependencies.fileSystem.rm(configPath)
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "Не удалось удалить прежнюю конфигурацию ibcmd"
    )
  }
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
  try {
    await dependencies.fileSystem.writeFile(
      configPath,
      initialized.stdout,
      { mode: PRIVATE_FILE_MODE }
    )
    if (dependencies.platform !== "win32") {
      await dependencies.fileSystem.chmod(configPath, PRIVATE_FILE_MODE)
    }
  } catch {
    try {
      await dependencies.fileSystem.rm(configPath)
    } catch {
      // Не заменяем безопасную ошибку подробностями файловой системы.
    }
    throw new PlatformSessionError(
      "session_start_failed",
      "Не удалось безопасно записать конфигурацию ibcmd"
    )
  }

  let closed = false
  const closeSession = async () => {
    if (closed) return { stoppedOwnedProcess: false }
    await dependencies.fileSystem.rm(configPath)
    closed = true
    return { stoppedOwnedProcess: false }
  }
  return {
    mode: "standalone-server",
    ownedProcess: false,
    isAlive() {
      return !closed
    },
    async exportConfiguration(outputDir, operationLogPath, unresolvedReferences, signal) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const command = buildStandaloneConfigExport({
        ibcmdPath,
        configPath,
        outputDir,
        unresolvedReferences,
        ...(params.settings.user === undefined ? {} : { user: params.settings.user }),
        ...(params.settings.password === undefined
          ? {}
          : { password: params.settings.password }),
      })
      const exported = await dependencies.processRuntime.run(command.command, command.args, {
        signal,
        terminationGraceMs: dependencies.closeTimeoutMs,
      })
      if (exported.cancelled === true) {
        throw new PlatformSessionError(
          "operation_cancelled",
          exported.terminationFailed === true
            ? "Выгрузка конфигурации через ibcmd отменена после ошибки остановки процесса"
            : "Выгрузка конфигурации через ibcmd отменена"
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
    async listExtensions(signal) {
      if (closed) {
        throw new PlatformSessionError(
          "platform_command_failed",
          "Соединение с платформой закрыто"
        )
      }
      if (signal?.aborted === true) {
        throw new PlatformSessionError(
          "operation_cancelled",
          "Получение списка расширений через ibcmd отменено"
        )
      }
      const command = buildStandaloneListExtensions({
        ibcmdPath,
        configPath,
        ...(params.settings.user === undefined
          ? {}
          : { user: params.settings.user }),
        ...(params.settings.password === undefined
          ? {}
          : { password: params.settings.password }),
      })
      const listed = await dependencies.processRuntime.run(
        command.command,
        command.args,
        {
          timeoutMs: dependencies.commandTimeoutMs,
          signal,
          terminationGraceMs: dependencies.closeTimeoutMs,
        }
      )
      if (listed.cancelled === true) {
        throw new PlatformSessionError(
          "operation_cancelled",
          "Получение списка расширений через ibcmd отменено"
        )
      }
      if (listed.timedOut === true) {
        throw new PlatformSessionError(
          "session_timeout",
          "Истекло время получения списка расширений через ibcmd"
        )
      }
      if (listed.exitCode !== 0) {
        throw new PlatformSessionError(
          "platform_command_failed",
          "ibcmd не смог получить список расширений"
        )
      }
      return parseIbcmdExtensionList(listed.stdout)
    },
    close: closeSession,
    cancel: closeSession,
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
