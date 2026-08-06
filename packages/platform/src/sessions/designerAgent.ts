import { isAbsolute, join, relative, resolve, sep } from "node:path"
import { parseConnection } from "../infobases/parseConnection"
import { parseExtensionPropertyRecords } from "../extensions/parse"
import {
  buildDesignerAgentLaunch,
  buildDumpConfigurationCommand,
  buildListDesignerExtensionsCommand,
} from "./commands"
import { PlatformSessionError } from "./errors"
import { platformFailure, type PlatformOperationLog } from "./operationLog"
import type { ProcessLogCursor, ProcessLogReader } from "./processLog"
import { openPlatformCommandSession } from "./sshProtocol"
import type {
  OwnedProcess,
  PlatformCommandSession,
  SessionPortRuntime,
  SessionProcessRuntime,
  SshTransport,
} from "./runtime"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

export interface DesignerAgentDependencies {
  portRuntime: SessionPortRuntime
  fileSystem: {
    mkdir(path: string): Promise<void>
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

export async function createDesignerAgentSession(
  params: CreatePlatformSessionParams,
  dependencies: DesignerAgentDependencies
): Promise<PlatformSession> {
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
  let failureStage: "session-start" | "authentication" = "session-start"
  try {
    const shell = await connectWithRetry({
      port,
      hostKeyHash,
      processHandle,
      dependencies,
      user: params.settings.user,
      password: params.settings.password,
    })
    failureStage = "authentication"
    if (params.operationLog !== undefined) {
      await appendAgentLog(params.operationLog, "stage=authentication status=start")
    }
    commandSession = await dependencies.openCommandSession({
      shell,
      user: params.settings.user,
      password: params.settings.password,
      timeoutMs: dependencies.startupTimeoutMs,
      operationLog: params.operationLog,
    })
    if (params.operationLog !== undefined) {
      await appendAgentLog(params.operationLog, "stage=authentication status=ready")
    }
    failureStage = "session-start"
    const directories = await readAgentDirectories(
      params.projectDir,
      agentBaseDir,
      params.settings.user ?? "",
      dependencies
    )
    canonicalAgentBaseDir = directories.agentBaseDir
    userServiceDir = directories.userServiceDir
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
    await moveStagingDirectory(
      pending.stagingDir,
      pending.outputDir,
      dependencies
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
    async exportConfiguration(outputDir, operationLog, unresolvedReferences, signal) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const resolvedOutputDir = await checkedOutputDir(
        canonicalAgentBaseDir,
        outputDir,
        dependencies
      )
      const stagingDir = join(userServiceDir, ".nkdk-export")
      await appendAgentLog(operationLog, "stage=configuration-export status=start")
      await prepareStagingDirectory(stagingDir, dependencies)
      const processLogCursor = await captureProcessLogCursor(
        processLogPath,
        dependencies.processLogReader
      )
      let commandFailure: unknown
      try {
        await commandSession.run(
          buildDumpConfigurationCommand(
            relativeAgentPath(userServiceDir, stagingDir),
            unresolvedReferences
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
        await moveStagingDirectory(stagingDir, resolvedOutputDir, dependencies)
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
  stage: "session-start" | "authentication" | "configuration-export",
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

async function checkedOutputDir(
  agentBaseDir: string,
  outputDir: string,
  dependencies: DesignerAgentDependencies
): Promise<string> {
  let resolvedOutputDir: string
  try {
    resolvedOutputDir = await dependencies.fileSystem.realpath(outputDir)
  } catch {
    throw new PlatformSessionError(
      "platform_command_failed",
      "Не удалось канонизировать каталог выгрузки"
    )
  }
  if (!isPathInside(agentBaseDir, resolvedOutputDir)) {
    throw new PlatformSessionError(
      "platform_command_failed",
      "Каталог выгрузки должен находиться внутри AgentBaseDir"
    )
  }
  return resolvedOutputDir
}

function relativeAgentPath(userServiceDir: string, stagingDir: string): string {
  return relative(userServiceDir, stagingDir).split(sep).join("/")
}

async function prepareStagingDirectory(
  stagingDir: string,
  dependencies: DesignerAgentDependencies
): Promise<void> {
  try {
    await dependencies.fileSystem.rm(stagingDir)
    await dependencies.fileSystem.mkdir(stagingDir)
  } catch {
    throw new PlatformSessionError(
      "platform_command_failed",
      "Не удалось подготовить каталог выгрузки агента"
    )
  }
}

async function moveStagingDirectory(
  stagingDir: string,
  outputDir: string,
  dependencies: DesignerAgentDependencies
): Promise<void> {
  await dependencies.fileSystem.rm(outputDir)
  await dependencies.fileSystem.rename(stagingDir, outputDir)
}

function isPathInside(baseDir: string, targetDir: string): boolean {
  const result = relative(resolve(baseDir), resolve(targetDir))
  return (
    result !== "" &&
    result !== ".." &&
    !result.startsWith(`..${sep}`) &&
    !isAbsolute(result)
  )
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
