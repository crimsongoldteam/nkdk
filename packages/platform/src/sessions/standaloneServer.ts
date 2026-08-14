import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { parse, stringify } from "yaml"
import { parseIbcmdExtensionList } from "../extensions/parse"
import { parseConnection } from "../infobases/parseConnection"
import {
  buildStandaloneConfigExport,
  buildStandaloneConfigInit,
  buildStandaloneListExtensions,
  buildStandaloneLaunch,
  buildLoadPartialConfigurationCommand,
} from "./commands"
import { PlatformSessionError } from "./errors"
import { platformFailure, type PlatformOperationLog } from "./operationLog"
import type {
  PlatformCommandSession,
  SessionPortRuntime,
  SessionProcessRuntime,
  SshTransport,
} from "./runtime"
import { openPlatformCommandSession } from "./sshProtocol"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

const PRIVATE_FILE_MODE = 0o600

export interface StandaloneServerDependencies {
  fileSystem: {
    mkdir(path: string): Promise<void>
    copyFile(from: string, to: string): Promise<void>
    writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
    chmod(path: string, mode: number): Promise<void>
    rm(path: string): Promise<void>
  }
  processRuntime: Pick<SessionProcessRuntime, "run" | "spawn">
  portRuntime: SessionPortRuntime
  generateHostKey(path: string): Promise<string>
  sshTransport: SshTransport
  openCommandSession: typeof openPlatformCommandSession
  startupTimeoutMs: number
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
  let initialized
  try {
    initialized = await dependencies.processRuntime.run(init.command, init.args, {
      timeoutMs: dependencies.commandTimeoutMs,
    })
  } catch (cause) {
    if (params.operationLog === undefined) throw cause
    throw await processFailure(
      params.operationLog,
      "session_start_failed",
      "session-start",
      cause instanceof Error ? cause.message : "",
      "ibcmd не смог подготовить конфигурацию автономного сервера",
      cause
    )
  }
  if (params.operationLog !== undefined && !(await params.operationLog.process("session-start", init, initialized))) {
    throw await logWriteFailure(params.operationLog)
  }
  if (initialized.timedOut === true) {
    if (params.operationLog !== undefined) {
      throw await processFailure(params.operationLog, "session_timeout", "session-start", "", "Истекло время подготовки конфигурации ibcmd")
    }
    throw new PlatformSessionError(
      "session_timeout",
      "Истекло время подготовки конфигурации ibcmd"
    )
  }
  if (initialized.exitCode !== 0) {
    if (params.operationLog !== undefined) {
      throw await processFailure(params.operationLog, "session_start_failed", "session-start", processText(initialized), "ibcmd не смог подготовить конфигурацию автономного сервера")
    }
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd не смог подготовить конфигурацию автономного сервера"
    )
  }
  parseConfiguration(initialized.stdout)
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
    async exportConfiguration(outputDir, operationLog, unresolvedReferences, signal, extensionName) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const command = buildStandaloneConfigExport({
        ibcmdPath,
        configPath,
        outputDir,
        unresolvedReferences,
        extensionName,
        ...infobaseCredentials(params.settings),
      })
      let exported
      try {
        exported = await dependencies.processRuntime.run(command.command, command.args, {
          timeoutMs: dependencies.commandTimeoutMs,
          signal,
          terminationGraceMs: dependencies.closeTimeoutMs,
        })
      } catch (cause) {
        throw await processFailure(operationLog, "platform_command_failed", "configuration-export", cause instanceof Error ? cause.message : "", "Не удалось запустить выгрузку конфигурации через ibcmd", cause)
      }
      if (!(await operationLog.process("configuration-export", command, exported))) {
        throw await logWriteFailure(operationLog)
      }
      if (exported.cancelled === true) {
        throw await processFailure(
          operationLog,
          "operation_cancelled",
          "configuration-export",
          "",
          exported.terminationFailed === true
            ? "Выгрузка конфигурации через ibcmd отменена после ошибки остановки процесса"
            : "Выгрузка конфигурации через ibcmd отменена"
        )
      }
      if (exported.timedOut === true) {
        throw await processFailure(operationLog, "session_timeout", "configuration-export", "", "Истекло время выгрузки конфигурации через ibcmd")
      }
      if (exported.exitCode !== 0) {
        throw await processFailure(operationLog, "platform_command_failed", "configuration-export", processText(exported), "ibcmd не смог выгрузить конфигурацию в XML")
      }
    },
    async loadPartialConfiguration(archivePath, loadTargets, operationLog, extensionName, signal) {
      if (closed) throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      const ibsrvPath = params.installation.ibsrvPath
      if (ibsrvPath === undefined) throw missingComponent("ibsrv")
      const serverDataDir = join(params.sessionDir, "server-data")
      const sessionDataDir = join(params.sessionDir, "session-data")
      const userServiceDir = join(serverDataDir, "users-data")
      const keyDir = join(params.sessionDir, ".ssh")
      const hostKeyPath = join(keyDir, "host.key")
      const [serverPort, sshPort] = await Promise.all([
        dependencies.portRuntime.reservePort("127.0.0.1"),
        dependencies.portRuntime.reservePort("127.0.0.1"),
      ])
      await dependencies.fileSystem.mkdir(keyDir)
      const hostKeyHash = await dependencies.generateHostKey(hostKeyPath)
      const configuration = parseConfiguration(initialized.stdout)
      configureServerGateway(configuration, { serverPort, sshPort, hostKeyPath })
      await dependencies.fileSystem.writeFile(configPath, stringify(configuration), { mode: PRIVATE_FILE_MODE })
      const stagingDir = join(userServiceDir, ".nkdk-load", randomUUID())
      const relativeStagingDir = stagingDir.slice(userServiceDir.length + 1)
      const stagedArchivePath = join(stagingDir, "package.zip")
      const stagedLoadListPath = join(stagingDir, "load.lst")
      await dependencies.fileSystem.mkdir(serverDataDir)
      await dependencies.fileSystem.mkdir(sessionDataDir)
      await dependencies.fileSystem.mkdir(stagingDir)
      await dependencies.fileSystem.copyFile(archivePath, stagedArchivePath)
      await dependencies.fileSystem.writeFile(stagedLoadListPath, formatLoadList(loadTargets))
      const launch = buildStandaloneLaunch({
        ibsrvPath,
        dataDir: serverDataDir,
        sessionDataDir,
        configPath,
      })
      const processHandle = dependencies.processRuntime.spawn(launch.command, launch.args, {
        cwd: params.sessionDir,
      })
      let commandSession: PlatformCommandSession | undefined
      try {
        await processHandle.waitForOutput("Stand-alone Server ready.", dependencies.startupTimeoutMs)
        const shell = await dependencies.sshTransport.connect({
          host: "127.0.0.1",
          port: sshPort,
          timeoutMs: dependencies.startupTimeoutMs,
          expectedHostKeyHash: hostKeyHash,
          ...infobaseCredentials(params.settings),
        })
        commandSession = await dependencies.openCommandSession({
          shell,
          user: params.settings.user,
          password: params.settings.password,
          timeoutMs: dependencies.startupTimeoutMs,
          operationLog,
        })
        const command = buildLoadPartialConfigurationCommand({
          stagingDir: relativeStagingDir,
          ...(extensionName === undefined ? {} : { extensionName }),
        })
        await operationLog.append(`command ${command}`)
        await commandSession.run(command, { signal, timeoutMs: dependencies.commandTimeoutMs, operationLog })
        await commandSession.run('config update-db-cfg --session-terminate="prompt"', {
          signal,
          timeoutMs: dependencies.commandTimeoutMs,
          operationLog,
        })
      } catch (cause) {
        throw await processFailure(operationLog, "platform_command_failed", "configuration-load", cause instanceof Error ? cause.message : "", "Автономный сервер не смог частично загрузить конфигурацию", cause)
      } finally {
        await stopStandaloneAgent(commandSession, processHandle, dependencies.closeTimeoutMs)
        await dependencies.fileSystem.rm(stagingDir).catch(() => undefined)
        await dependencies.fileSystem.writeFile(configPath, initialized.stdout, { mode: PRIVATE_FILE_MODE })
      }
      return { warnings: [] }
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

function processText(result: { stderr: string; stdout: string }): string {
  return `${result.stderr}\n${result.stdout}`
}

async function processFailure(
  operationLog: PlatformOperationLog,
  code: Parameters<typeof platformFailure>[0]["code"],
  stage: Parameters<typeof platformFailure>[0]["stage"],
  platformText: string,
  fallbackMessage: string,
  cause?: unknown
): Promise<PlatformSessionError> {
  return platformFailure({
    code,
    stage,
    mode: "standalone-server",
    log: operationLog,
    platformText,
    fallbackMessage,
    ...(cause === undefined ? {} : { cause }),
  })
}

async function logWriteFailure(operationLog: PlatformOperationLog): Promise<PlatformSessionError> {
  return processFailure(operationLog, "platform_command_failed", "platform-log", "", "Не удалось записать журнал операции платформы")
}

function missingComponent(name: string): PlatformSessionError {
  return new PlatformSessionError(
    "platform_component_missing",
    `В установке платформы 8.3.27 не найден ${name}`
  )
}

function parseConfiguration(source: string): Record<string, unknown> {
  try {
    const configuration: unknown = parse(source)
    if (!isRecord(configuration)) throw new Error("configuration is not an object")
    return configuration
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd вернул некорректную конфигурацию автономного сервера"
    )
  }
}

function configureServerGateway(
  configuration: Record<string, unknown>,
  params: { serverPort: number; sshPort: number; hostKeyPath: string }
): void {
  configuration["server"] = { address: "localhost", port: params.serverPort }
  configuration["gates"] = {
    ssh: {
      admin: {
        address: "localhost",
        port: params.sshPort,
        "host-key": params.hostKeyPath,
      },
    },
  }
}

function formatLoadList(loadTargets: readonly string[]): string {
  return loadTargets.length === 0 ? "" : `${loadTargets.join("\n")}\n`
}

async function stopStandaloneAgent(
  commandSession: PlatformCommandSession | undefined,
  processHandle: ReturnType<SessionProcessRuntime["spawn"]>,
  closeTimeoutMs: number
): Promise<void> {
  if (commandSession !== undefined) {
    await commandSession.run("common disconnect-ib").catch(() => undefined)
    await commandSession.run("common shutdown").catch(() => undefined)
    await commandSession.close().catch(() => undefined)
  }
  if (!processHandle.isAlive()) return
  if (await processHandle.wait(closeTimeoutMs)) return
  await processHandle.kill()
  await processHandle.wait(closeTimeoutMs)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function infobaseCredentials(settings: CreatePlatformSessionParams["settings"]): {
  user?: string
  password?: string
} {
  return {
    ...(settings.user === undefined ? {} : { user: settings.user }),
    ...(settings.password === undefined ? {} : { password: settings.password }),
  }
}
