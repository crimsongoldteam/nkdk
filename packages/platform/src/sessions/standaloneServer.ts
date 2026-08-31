import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { parse, stringify } from "yaml"
import { parseExtensionPropertyRecords } from "../extensions/parse"
import { parseConnection } from "../infobases/parseConnection"
import {
  buildDumpConfigurationCommand,
  buildListDesignerExtensionsCommand,
  buildStandaloneConfigInit,
  buildStandaloneLaunch,
  buildLoadPartialConfigurationCommand,
  classifyPartialLoad,
} from "./commands"
import { PlatformSessionError } from "./errors"
import {
  checkedOperationOutputDir,
  createInteractiveCommandSessionOpener,
  prepareSessionStagingDirectory,
  publishSessionStagingDirectory,
  relativeServicePath,
} from "./interactiveSessionFiles"
import { platformFailure, type PlatformOperationLog } from "./operationLog"
import type {
  PlatformCommandSession,
  PlatformFailureStage,
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
    realpath(path: string): Promise<string>
    rename(from: string, to: string): Promise<void>
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
  const ibsrvPath = params.installation.ibsrvPath
  if (ibsrvPath === undefined) throw missingComponent("ibsrv")

  const configPath = join(params.sessionDir, "config.yaml")
  const init = (() => {
    if (connection.type === "file") {
      return buildStandaloneConfigInit({
        ibcmdPath,
        databasePath: connection.path,
      })
    }
    if (connection.type === "server") {
      if (params.settings.database === undefined) {
        throw new PlatformSessionError(
          "unsupported_connection",
          "Для автономного сервера клиент-серверной базы нужны параметры СУБД",
        )
      }
      return buildStandaloneConfigInit({
        ibcmdPath,
        database: params.settings.database,
      })
    }
    throw new PlatformSessionError(
      "unsupported_connection",
      "Автономный режим поддерживает только файловые и клиент-серверные информационные базы",
    )
  })()
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

  const serverDataDir = join(params.sessionDir, "server-data")
  const sessionDataDir = join(params.sessionDir, "session-data")
  const userServiceDir = join(serverDataDir, "users-data")
  const keyDir = join(params.sessionDir, ".ssh")
  const hostKeyPath = join(keyDir, "host.key")
  let processHandle: ReturnType<SessionProcessRuntime["spawn"]> | undefined
  let commandSession: PlatformCommandSession | undefined
  let failureStage: PlatformFailureStage = "session-start"
  const openCommandSession = createInteractiveCommandSessionOpener({
    openCommandSession: dependencies.openCommandSession,
    settings: params.settings,
    timeoutMs: dependencies.startupTimeoutMs,
    operationLog: params.operationLog,
  })
  try {
    const [serverPort, sshPort] = await Promise.all([
      dependencies.portRuntime.reservePort("127.0.0.1"),
      dependencies.portRuntime.reservePort("127.0.0.1"),
    ])
    await dependencies.fileSystem.mkdir(keyDir)
    const hostKeyHash = await dependencies.generateHostKey(hostKeyPath)
    const configuration = parseConfiguration(initialized.stdout)
    configureServerGateway(configuration, { serverPort, sshPort, hostKeyPath })
    await dependencies.fileSystem.writeFile(
      configPath,
      stringify(configuration),
      { mode: PRIVATE_FILE_MODE }
    )
    await dependencies.fileSystem.mkdir(serverDataDir)
    await dependencies.fileSystem.mkdir(sessionDataDir)
    const launch = buildStandaloneLaunch({
      ibsrvPath,
      dataDir: serverDataDir,
      sessionDataDir,
      configPath,
    })
    processHandle = dependencies.processRuntime.spawn(launch.command, launch.args, {
      cwd: params.sessionDir,
    })
    await processHandle.waitForOutput(
      "Stand-alone Server ready.",
      dependencies.startupTimeoutMs
    )
    const shell = await dependencies.sshTransport.connect({
      host: "127.0.0.1",
      port: sshPort,
      timeoutMs: dependencies.startupTimeoutMs,
      expectedHostKeyHash: hostKeyHash,
      ...infobaseCredentials(params.settings),
    })
    commandSession = await openCommandSession(
      shell,
      async (stage, status) => {
        failureStage = stage
        if (
          params.operationLog !== undefined &&
          !(await params.operationLog.append(`stage=${stage} status=${status}`))
        ) {
          throw await logWriteFailure(params.operationLog)
        }
      }
    )
  } catch (cause) {
    if (processHandle !== undefined) {
      await stopStandaloneAgent(commandSession, processHandle, dependencies.closeTimeoutMs)
    }
    await dependencies.fileSystem.rm(configPath).catch(() => undefined)
    if (params.operationLog === undefined) {
      if (cause instanceof PlatformSessionError) throw cause
      throw new PlatformSessionError(
        "session_start_failed",
        "Автономный сервер не смог открыть командный сеанс",
        { cause }
      )
    }
    if (cause instanceof PlatformSessionError && cause.details !== undefined) throw cause
    throw await processFailure(
      params.operationLog,
      cause instanceof PlatformSessionError ? cause.code : "session_start_failed",
      failureStage,
      cause instanceof Error ? cause.message : "",
      "Автономный сервер не смог открыть командный сеанс",
      cause
    )
  }
  if (processHandle === undefined || commandSession === undefined) {
    throw new PlatformSessionError(
      "session_start_failed",
      "Автономный сервер не открыл командный сеанс"
    )
  }
  const residentProcess = processHandle
  const residentCommandSession = commandSession

  let runtimeStopped = false
  let closed = false
  const closeSession = async () => {
    if (closed) return { stoppedOwnedProcess: false }
    let stoppedOwnedProcess = false
    if (!runtimeStopped) {
      await stopStandaloneAgent(
        residentCommandSession,
        residentProcess,
        dependencies.closeTimeoutMs
      )
      runtimeStopped = true
      stoppedOwnedProcess = true
    }
    await dependencies.fileSystem.rm(configPath)
    closed = true
    return { stoppedOwnedProcess }
  }
  return {
    mode: "standalone-server",
    ownedProcess: residentProcess.owned,
    isAlive() {
      return !closed && !runtimeStopped
        && residentProcess.isAlive()
        && residentCommandSession.isAlive()
    },
    async exportConfiguration(outputDir, operationLog, unresolvedReferences, signal, extensionName) {
      if (closed || runtimeStopped) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const resolvedOutputDir = await checkedOperationOutputDir(
        params.projectDir,
        outputDir,
        dependencies.fileSystem
      )
      const stagingDir = join(userServiceDir, ".nkdk-export", randomUUID())
      await prepareSessionStagingDirectory(
        stagingDir,
        dependencies.fileSystem,
        "Не удалось подготовить каталог выгрузки автономного сервера"
      )
      try {
        await residentCommandSession.run(
          buildDumpConfigurationCommand(
            relativeServicePath(userServiceDir, stagingDir),
            unresolvedReferences,
            extensionName
          ),
          { signal, timeoutMs: dependencies.commandTimeoutMs, operationLog }
        )
        await publishSessionStagingDirectory(
          stagingDir,
          resolvedOutputDir,
          dependencies.fileSystem
        )
      } catch (cause) {
        throw await processFailure(
          operationLog,
          cause instanceof PlatformSessionError
            ? cause.code
            : "platform_command_failed",
          "configuration-export",
          cause instanceof Error ? cause.message : "",
          "Автономный сервер не смог выгрузить конфигурацию",
          cause
        )
      } finally {
        await dependencies.fileSystem.rm(stagingDir).catch(() => undefined)
      }
    },
    async loadPartialConfiguration(
      archivePath,
      loadTargets,
      operationLog,
      extensionName,
      signal,
      updateDatabaseConfiguration = true,
    ) {
      if (connection.type === "server") {
        throw new PlatformSessionError(
          "unsupported_connection",
          "Автономный режим пока поддерживает клиент-серверные информационные базы только для импорта"
        )
      }
      if (closed || runtimeStopped) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const stagingDir = join(userServiceDir, ".nkdk-load", randomUUID())
      const stagedArchivePath = join(stagingDir, "package.zip")
      const stagedLoadListPath = join(stagingDir, "load.lst")
      await dependencies.fileSystem.mkdir(stagingDir)
      await dependencies.fileSystem.copyFile(archivePath, stagedArchivePath)
      await dependencies.fileSystem.writeFile(stagedLoadListPath, formatLoadList(loadTargets))
      let failureStage: PlatformFailureStage = "configuration-load"
      try {
        const loadMode = classifyPartialLoad(loadTargets)
        const command = buildLoadPartialConfigurationCommand({
          stagingDir: relativeServicePath(userServiceDir, stagingDir),
          loadMode,
          ...(extensionName === undefined ? {} : { extensionName }),
        })
        await operationLog.append(`command ${command}`)
        await residentCommandSession.run(command, { signal, timeoutMs: dependencies.commandTimeoutMs, operationLog })
        if (updateDatabaseConfiguration) {
          await residentCommandSession.run('config update-db-cfg --session-terminate="prompt"', {
            signal,
            timeoutMs: dependencies.commandTimeoutMs,
            operationLog,
          })
        }
      } catch (cause) {
        if (cause instanceof PlatformSessionError && cause.details !== undefined) throw cause
        throw await processFailure(
          operationLog,
          cause instanceof PlatformSessionError ? cause.code : "platform_command_failed",
          failureStage,
          cause instanceof Error ? cause.message : "",
          "Автономный сервер не смог частично загрузить конфигурацию",
          cause
        )
      } finally {
        await dependencies.fileSystem.rm(stagingDir).catch(() => undefined)
      }
      return { warnings: [], loadMode: classifyPartialLoad(loadTargets) }
    },
    async listExtensions(signal) {
      if (closed || runtimeStopped) {
        throw new PlatformSessionError(
          "platform_command_failed",
          "Соединение с платформой закрыто"
        )
      }
      if (signal?.aborted === true) {
        throw new PlatformSessionError(
          "operation_cancelled",
          "Получение списка расширений отменено"
        )
      }
      let result
      try {
        result = await residentCommandSession.run(
          buildListDesignerExtensionsCommand(),
          { signal, timeoutMs: dependencies.commandTimeoutMs }
        )
      } catch (cause) {
        const code = cause instanceof PlatformSessionError
          ? cause.code
          : "platform_command_failed"
        const message = code === "operation_cancelled"
          ? "Получение списка расширений отменено"
          : code === "session_timeout"
            ? "Истекло время получения списка расширений"
            : "Автономный сервер не смог получить список расширений"
        throw new PlatformSessionError(code, message, { cause })
      }
      return parseExtensionPropertyRecords(result.extensionInfo ?? [])
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
