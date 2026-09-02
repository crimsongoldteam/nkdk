import { randomUUID } from "node:crypto"
import { join, resolve } from "node:path"
import { parseConnection } from "../infobases/parseConnection"
import { parseExtensionPropertyRecords } from "../extensions/parse"
import {
  buildDesignerAgentLaunch,
  buildDumpConfigurationCommand,
  buildListDesignerExtensionsCommand,
  buildLoadPartialConfigurationCommand,
  buildUpdateDatabaseConfigurationCommand,
  classifyPartialLoad,
} from "./commands"
import { PlatformSessionError } from "./errors"
import {
  checkedOperationOutputDir,
  createInteractiveCommandSessionOpener,
  isPathInside,
  prepareSessionStagingDirectory,
  publishSessionStagingDirectory,
  relativeServicePath,
} from "./interactiveSessionFiles"
import { platformFailure, type PlatformOperationLog } from "./operationLog"
import type { ProcessLogCursor, ProcessLogReader } from "./processLog"
import { openPlatformCommandSession } from "./sshProtocol"
import type {
  OwnedProcess,
  PlatformCommandSession,
  PlatformFailureStage,
  SessionPortRuntime,
  SessionProcessRuntime,
  SshTransport,
} from "./runtime"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

export interface DesignerAgentDependencies {
  portRuntime: SessionPortRuntime
  fileSystem: {
    mkdir(path: string): Promise<void>
    copyFile(from: string, to: string): Promise<void>
    readFile(path: string): Promise<string>
    realpath(path: string): Promise<string>
    rm(path: string): Promise<void>
    rename(from: string, to: string): Promise<void>
    writeFile(path: string, content: string): Promise<void>
  }
  processRuntime: Pick<SessionProcessRuntime, "spawn">
  processLogReader: ProcessLogReader
  generateHostKey(path: string): Promise<string>
  sshTransport: SshTransport
  openCommandSession: typeof openPlatformCommandSession
  clock: {
    now(): number
    sleep(timeoutMs: number): Promise<void>
  }
  startupTimeoutMs: number
  commandTimeoutMs: number
  retryDelayMs: number
  closeTimeoutMs: number
}

export type DesignerAgentSession = PlatformSession & Required<Pick<PlatformSession, "loadPartialConfiguration">>

export async function createDesignerAgentSession(
  params: CreatePlatformSessionParams,
  dependencies: DesignerAgentDependencies
): Promise<DesignerAgentSession> {
  const enterprisePath = params.installation.enterprisePath
  if (enterprisePath === undefined) {
    throw new PlatformSessionError(
      "platform_component_missing",
      "В установке платформы 8.3.27 не найден 1cv8"
    )
  }
  const connection = parseConnection(params.settings.connectionString)
  if (connection.type !== "file" && connection.type !== "server") {
    throw new PlatformSessionError(
      "unsupported_connection",
      "Агент Конфигуратора поддерживает только файловые и клиент-серверные базы"
    )
  }

  const agentBaseDir = join(params.projectDir, ".nkdk")
  const port = await dependencies.portRuntime.reservePort("127.0.0.1")
  await dependencies.fileSystem.mkdir(params.sessionDir)
  const hostKeyPath = join(params.sessionDir, "host.key")
  const processLogPath = join(params.sessionDir, "process.log")
  let hostKeyHash: string
  try {
    hostKeyHash = await dependencies.generateHostKey(hostKeyPath)
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "Не удалось подготовить SSH-ключ агента Конфигуратора"
    )
  }
  const launch = buildDesignerAgentLaunch({
    enterprisePath,
    connection,
    hostKeyPath,
    baseDir: agentBaseDir,
    logPath: processLogPath,
    port,
  })
  if (params.operationLog !== undefined) {
    await appendAgentLog(
      params.operationLog,
      [
        "stage=session-start",
        `launch=${launch.command} ${launch.args.join(" ")}`,
        `authentication=${params.settings.user === undefined && params.settings.password === undefined ? "os" : "credentials"}`,
      ].join(" ")
    )
  }
  const processHandle = dependencies.processRuntime.spawn(
    launch.command,
    launch.args,
    { cwd: agentBaseDir }
  )
  if (!processHandle.isAlive()) {
    const failure = new PlatformSessionError(
      "session_start_failed",
      "Агент Конфигуратора завершился до открытия SSH"
    )
    if (params.operationLog !== undefined) {
      throw await agentFailure(failure, "session-start", params.operationLog, processLogPath, dependencies)
    }
    throw failure
  }

  let commandSession: PlatformCommandSession
  let userServiceDir: string
  let canonicalAgentBaseDir: string
  let failureStage: PlatformFailureStage = "session-start"
  const openCommandSession = createInteractiveCommandSessionOpener({
    openCommandSession: dependencies.openCommandSession,
    settings: params.settings,
    timeoutMs: dependencies.startupTimeoutMs,
    operationLog: params.operationLog,
  })
  try {
    const shell = await connectWithRetry({
      port,
      hostKeyHash,
      processHandle,
      dependencies,
      user: params.settings.user,
      password: params.settings.password,
    })
    commandSession = await openCommandSession(
      shell,
      async (stage, status) => {
        failureStage = stage
        if (params.operationLog !== undefined) {
          await appendAgentLog(params.operationLog, `stage=${stage} status=${status}`)
        }
      }
    )
    failureStage = "session-start"
    const directories = await readAgentDirectories(
      params.projectDir,
      agentBaseDir,
      params.settings.user ?? "",
      dependencies
    )
    canonicalAgentBaseDir = directories.agentBaseDir
    userServiceDir = directories.userServiceDir
    await ignoreCleanupError(() =>
      dependencies.fileSystem.rm(join(userServiceDir, ".nkdk-load")))
  } catch (caught) {
    await stopAfterFailedStart(processHandle)
    if (params.operationLog !== undefined) {
      const stage = caught instanceof PlatformSessionError && caught.code === "authentication_failed"
        ? "authentication"
        : failureStage
      throw await agentFailure(caught, stage, params.operationLog, processLogPath, dependencies)
    }
    throw caught
  }

  let closed = false
  let pendingCancelledDump:
    | { stagingDir: string; outputDir: string }
    | undefined
  const stopCancelledSession = async () => {
    if (closed) return { stoppedOwnedProcess: false }
    await ignoreCleanupError(() => commandSession.close())
    if (!processHandle.owned) {
      await ignoreCleanupError(() => processHandle.wait(dependencies.closeTimeoutMs))
      closed = true
      return { stoppedOwnedProcess: false }
    }
    if (!processHandle.isAlive()) {
      closed = true
      return { stoppedOwnedProcess: false }
    }
    if (processHandle.signal !== undefined) {
      await processHandle.signal("SIGTERM")
    } else {
      await processHandle.kill("SIGTERM")
    }
    const exited = await processHandle.wait(dependencies.closeTimeoutMs)
    if (!exited && processHandle.isAlive()) {
      await processHandle.kill("SIGKILL")
      await ensureProcessStopped(processHandle, dependencies.closeTimeoutMs)
    }
    closed = true
    return { stoppedOwnedProcess: true }
  }
  const finalizeCancelledDump = async () => {
    const pending = pendingCancelledDump
    if (pending === undefined) return
    await publishSessionStagingDirectory(
      pending.stagingDir,
      pending.outputDir,
      dependencies.fileSystem
    )
    pendingCancelledDump = undefined
  }
  const cancelSession = async () => {
    const result = await stopCancelledSession()
    await finalizeCancelledDump()
    return result
  }
  return {
    mode: "designer-agent",
    ownedProcess: processHandle.owned,
    isAlive() {
      return !closed && processHandle.isAlive() && commandSession.isAlive()
    },
    async exportConfiguration(outputDir, operationLog, unresolvedReferences, signal, extensionName) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const resolvedOutputDir = await checkedOperationOutputDir(
        canonicalAgentBaseDir,
        outputDir,
        dependencies.fileSystem,
        "Каталог выгрузки должен находиться внутри AgentBaseDir"
      )
      const stagingDir = join(userServiceDir, ".nkdk-export")
      await appendAgentLog(operationLog, "stage=configuration-export status=start")
      await prepareSessionStagingDirectory(
        stagingDir,
        dependencies.fileSystem,
        "Не удалось подготовить каталог выгрузки агента"
      )
      const processLogCursor = await captureProcessLogCursor(
        processLogPath,
        dependencies.processLogReader
      )
      let commandFailure: unknown
      try {
        await commandSession.run(
          buildDumpConfigurationCommand(
            relativeServicePath(userServiceDir, stagingDir),
            unresolvedReferences,
            extensionName
          ),
          { signal, operationLog }
        )
      } catch (caught) {
        if (
          caught instanceof PlatformSessionError &&
          caught.code === "operation_cancelled"
        ) {
          pendingCancelledDump = {
            stagingDir,
            outputDir: resolvedOutputDir,
          }
          try {
            await cancelSession()
          } catch {
            // Менеджер повторит остановку, сохранив исходную отмену.
          }
          throw await agentFailure(
            caught,
            "configuration-export",
            operationLog,
            processLogPath,
            dependencies,
            processLogCursor
          )
        }
        commandFailure = caught
      }
      try {
        await publishSessionStagingDirectory(
          stagingDir,
          resolvedOutputDir,
          dependencies.fileSystem
        )
      } catch {
        if (commandFailure === undefined) {
          throw await agentFailure(
            new PlatformSessionError(
              "platform_command_failed",
              "Не удалось переместить выгрузку агента в каталог операции"
            ),
            "configuration-export",
            operationLog,
            processLogPath,
            dependencies,
            processLogCursor
          )
        }
      }
      if (commandFailure !== undefined) {
        throw await agentFailure(
          commandFailure,
          "configuration-export",
          operationLog,
          processLogPath,
          dependencies,
          processLogCursor
        )
      }
      await appendAgentLog(operationLog, "stage=configuration-export status=ready")
    },
    async listExtensions(signal) {
      if (closed) {
        throw new PlatformSessionError(
          "platform_command_failed",
          "Соединение с платформой закрыто"
        )
      }
      const result = await commandSession.run(
        buildListDesignerExtensionsCommand(),
        { signal, timeoutMs: dependencies.commandTimeoutMs }
      )
      if (result.extensionInfo === undefined) {
        throw new PlatformSessionError(
          "platform_command_failed",
          "Платформа вернула некорректный список расширений"
        )
      }
      return parseExtensionPropertyRecords(result.extensionInfo)
    },
    async loadPartialConfiguration(
      archivePath,
      loadTargets,
      operationLog,
      extensionName,
      signal,
      updateDatabaseConfiguration = true,
    ) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const canonicalArchivePath = await checkedArchivePath(
        params.projectDir,
        archivePath,
        dependencies
      )
      const loadList = formatLoadList(loadTargets)
      const stagingDir = join(userServiceDir, ".nkdk-load", randomUUID())
      const stagedArchivePath = join(stagingDir, "package.zip")
      const stagedLoadListPath = join(stagingDir, "load.lst")
      const cleanupStaging = async (): Promise<boolean> => {
        try {
          await dependencies.fileSystem.rm(stagingDir)
          return true
        } catch {
          await operationLog.append("cleanup stage=configuration-load status=failed")
          return false
        }
      }
      await appendAgentLog(operationLog, "stage=configuration-load status=start")
      try {
        await dependencies.fileSystem.mkdir(stagingDir)
        await dependencies.fileSystem.copyFile(canonicalArchivePath, stagedArchivePath)
        await dependencies.fileSystem.writeFile(stagedLoadListPath, loadList)
      } catch (cause) {
        await cleanupStaging()
        throw await agentFailure(
          cause,
          "configuration-load",
          operationLog,
          processLogPath,
          dependencies
        )
      }
      const processLogCursor = await captureProcessLogCursor(
        processLogPath,
        dependencies.processLogReader
      )
      const loadMode = classifyPartialLoad(loadTargets)
      const command = buildLoadPartialConfigurationCommand({
        stagingDir: relativeServicePath(userServiceDir, stagingDir),
        loadMode,
        updateDumpInfo: true,
        ...(extensionName === undefined ? {} : { extensionName }),
      })
      await appendAgentLog(operationLog, `command ${command}`)
      try {
        await commandSession.run(
          command,
          { signal, timeoutMs: dependencies.commandTimeoutMs, operationLog }
        )
        if (updateDatabaseConfiguration) {
          await commandSession.run(buildUpdateDatabaseConfigurationCommand(extensionName), {
            signal,
            timeoutMs: dependencies.commandTimeoutMs,
            operationLog,
          })
        }
      } catch (caught) {
        await cleanupStaging()
        const cause = caught instanceof PlatformSessionError && caught.commandOutcome === "unknown"
          ? new PlatformSessionError(
              "delivery_outcome_unknown",
              caught.message,
              { cause: caught, commandOutcome: "unknown" }
            )
          : caught
        throw await agentFailure(
          cause,
          "configuration-load",
          operationLog,
          processLogPath,
          dependencies,
          processLogCursor
        )
      }
      const warnings: string[] = []
      const appendAfterSuccess = async (message: string) => {
        if (await operationLog.append(message)) return
        if (!warnings.includes("Не удалось дополнить журнал после успешной загрузки")) {
          warnings.push("Не удалось дополнить журнал после успешной загрузки")
        }
      }
      await appendAfterSuccess("command-response status=success")
      try {
        const processLog = await dependencies.processLogReader.readSince(
          processLogPath,
          processLogCursor,
        )
        if (processLog.trim() !== "") await appendAfterSuccess(`process-log\n${processLog}`)
      } catch {
        warnings.push("Не удалось прочитать новый фрагмент /Out после успешной загрузки")
      }
      if (!await cleanupStaging()) {
        warnings.push("Не удалось удалить служебную копию ZIP после успешной загрузки")
      }
      await appendAfterSuccess("stage=configuration-load status=ready")
      return { warnings, loadMode }
    },
    async close() {
      if (closed) return { stoppedOwnedProcess: false }
      await ignoreCleanupError(() =>
        runCleanupCommand(
          () => commandSession.run("common disconnect-ib"),
          dependencies
        )
      )
      await ignoreCleanupError(() =>
        runCleanupCommand(
          () => commandSession.run("common shutdown"),
          dependencies
        )
      )
      await ignoreCleanupError(() => commandSession.close())
      if (!processHandle.owned) {
        await ignoreCleanupError(() => processHandle.wait(dependencies.closeTimeoutMs))
        closed = true
        return { stoppedOwnedProcess: false }
      }
      if (!processHandle.isAlive()) {
        closed = true
        return { stoppedOwnedProcess: false }
      }
      const exited = await processHandle.wait(dependencies.closeTimeoutMs)
      if (!exited && processHandle.isAlive()) {
        await processHandle.kill()
        await ensureProcessStopped(processHandle, dependencies.closeTimeoutMs)
      }
      closed = true
      return { stoppedOwnedProcess: true }
    },
    cancel: cancelSession,
  }
}

function formatLoadList(loadTargets: readonly string[]): string {
  for (const target of loadTargets) {
    if (target.length === 0
      || target.startsWith("/")
      || target.includes("\\")
      || target.includes("\0")
      || target.includes("\n")
      || target.includes("\r")
      || target.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
      throw new PlatformSessionError(
        "platform_command_failed",
        `Некорректный путь в списке частичной загрузки: ${target}`
      )
    }
  }
  return loadTargets.length === 0 ? "" : `${loadTargets.join("\n")}\n`
}

async function appendAgentLog(operationLog: PlatformOperationLog, message: string): Promise<void> {
  if (await operationLog.append(message)) return
  throw await platformFailure({
    code: "platform_command_failed",
    stage: "platform-log",
    mode: "designer-agent",
    log: operationLog,
    platformText: "",
    fallbackMessage: "Не удалось записать журнал операции платформы",
  })
}

async function agentFailure(
  cause: unknown,
  stage: "session-start" | "protocol-handshake" | "authentication" | "configuration-export" | "configuration-load",
  operationLog: PlatformOperationLog,
  processLogPath: string,
  dependencies: DesignerAgentDependencies,
  processLogCursor?: ProcessLogCursor
): Promise<PlatformSessionError> {
  if (cause instanceof PlatformSessionError && cause.details !== undefined) return cause
  try {
    const processLog = await dependencies.processLogReader.readSince(
      processLogPath,
      processLogCursor
    )
    if (processLog.trim() !== "") {
      await operationLog.append(`process-log\n${processLog}`)
    } else {
      await operationLog.append("process-log empty=true")
    }
  } catch {
    // Исходная ошибка платформы важнее недоступного /Out-журнала.
  }
  return platformFailure({
    code: cause instanceof PlatformSessionError ? cause.code : "platform_command_failed",
    stage,
    mode: "designer-agent",
    log: operationLog,
    platformText: cause instanceof Error ? cause.message : "",
    fallbackMessage: "Операция агента Конфигуратора завершилась с ошибкой",
    cause,
  })
}

async function captureProcessLogCursor(
  path: string,
  reader: ProcessLogReader
): Promise<ProcessLogCursor | undefined> {
  try {
    return await reader.capture(path)
  } catch {
    return undefined
  }
}

async function ensureProcessStopped(
  processHandle: OwnedProcess,
  timeoutMs: number
): Promise<void> {
  const exited = await processHandle.wait(timeoutMs)
  if (!exited && processHandle.isAlive()) {
    throw new Error("Не удалось остановить дочерний процесс")
  }
}

async function runCleanupCommand(
  command: () => Promise<unknown>,
  dependencies: DesignerAgentDependencies
): Promise<void> {
  await Promise.race([
    command(),
    dependencies.clock.sleep(dependencies.closeTimeoutMs),
  ])
}

async function readAgentDirectories(
  projectDir: string,
  agentBaseDir: string,
  userName: string,
  dependencies: DesignerAgentDependencies
): Promise<{ agentBaseDir: string; userServiceDir: string }> {
  try {
    const parsed: unknown = JSON.parse(
      await dependencies.fileSystem.readFile(join(agentBaseDir, "agentbasedir.json"))
    )
    if (!isRecord(parsed) || !Array.isArray(parsed["usersInfo"])) {
      throw new Error("invalid agent base mapping")
    }
    const user = parsed["usersInfo"].find(
      (entry) =>
        isRecord(entry) &&
        entry["name"] === userName &&
        typeof entry["dir"] === "string"
    )
    if (!isRecord(user) || typeof user["dir"] !== "string") {
      throw new Error("agent user mapping not found")
    }
    const serviceDir = resolve(agentBaseDir, user["dir"])
    if (!isPathInside(agentBaseDir, serviceDir)) {
      throw new Error("agent user directory escapes base")
    }
    const canonicalProjectDir = await dependencies.fileSystem.realpath(projectDir)
    const canonicalAgentBaseDir = await dependencies.fileSystem.realpath(agentBaseDir)
    if (!isPathInside(canonicalProjectDir, canonicalAgentBaseDir)) {
      throw new Error("agent base directory escapes project")
    }
    const canonicalServiceDir = await dependencies.fileSystem.realpath(serviceDir)
    if (!isPathInside(canonicalAgentBaseDir, canonicalServiceDir)) {
      throw new Error("agent user directory symlink escapes base")
    }
    return {
      agentBaseDir: canonicalAgentBaseDir,
      userServiceDir: canonicalServiceDir,
    }
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "Не удалось определить рабочий каталог пользователя агента Конфигуратора"
    )
  }
}

async function checkedArchivePath(
  projectDir: string,
  archivePath: string,
  dependencies: DesignerAgentDependencies
): Promise<string> {
  try {
    const canonicalProjectDir = await dependencies.fileSystem.realpath(projectDir)
    const canonicalArchivePath = await dependencies.fileSystem.realpath(archivePath)
    if (!isPathInside(canonicalProjectDir, canonicalArchivePath)) throw new Error("outside project")
    return canonicalArchivePath
  } catch {
    throw new PlatformSessionError(
      "platform_command_failed",
      "ZIP частичной загрузки должен находиться внутри проекта"
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function connectWithRetry(params: {
  port: number
  hostKeyHash: string
  processHandle: OwnedProcess
  dependencies: DesignerAgentDependencies
  user?: string
  password?: string
}) {
  const deadline = params.dependencies.clock.now() + params.dependencies.startupTimeoutMs
  for (;;) {
    if (!params.processHandle.isAlive()) {
      throw new PlatformSessionError(
        "session_start_failed",
        "Агент Конфигуратора завершился до открытия SSH"
      )
    }
    try {
      return await params.dependencies.sshTransport.connect({
        host: "127.0.0.1",
        port: params.port,
        timeoutMs: params.dependencies.startupTimeoutMs,
        expectedHostKeyHash: params.hostKeyHash,
        user: params.user,
        password: params.password,
      })
    } catch (caught) {
      if (caught instanceof PlatformSessionError && caught.code === "authentication_failed") {
        throw caught
      }
      if (params.dependencies.clock.now() >= deadline) {
        throw new PlatformSessionError(
          "session_timeout",
          "Истекло время запуска агента Конфигуратора"
        )
      }
      await params.dependencies.clock.sleep(params.dependencies.retryDelayMs)
    }
  }
}

async function stopAfterFailedStart(processHandle: OwnedProcess): Promise<void> {
  if (!processHandle.owned || !processHandle.isAlive()) return
  await ignoreCleanupError(() => processHandle.kill())
}

async function ignoreCleanupError(operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation()
  } catch {
    // Ошибка очистки не должна мешать освобождению остальных ресурсов.
  }
}
