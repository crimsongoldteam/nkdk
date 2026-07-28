import { isAbsolute, join, relative, resolve, sep } from "node:path"
import { parseConnection } from "../infobases/parseConnection"
import { parseExtensionPropertyRecords } from "../extensions/parse"
import {
  buildDesignerAgentLaunch,
  buildDumpConfigurationCommand,
  buildListDesignerExtensionsCommand,
} from "./commands"
import { PlatformSessionError } from "./errors"
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
  generateHostKey(path: string): Promise<string>
  sshTransport: SshTransport
  openCommandSession: typeof openPlatformCommandSession
  clock: {
    now(): number
    sleep(timeoutMs: number): Promise<void>
  }
  startupTimeoutMs: number
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
    logPath: join(params.sessionDir, "process.log"),
    port,
  })
  const processHandle = dependencies.processRuntime.spawn(launch.command, launch.args)
  if (!processHandle.isAlive()) {
    throw new PlatformSessionError(
      "session_start_failed",
      "Агент Конфигуратора завершился до открытия SSH"
    )
  }

  let commandSession: PlatformCommandSession
  let userServiceDir: string
  let canonicalAgentBaseDir: string
  try {
    const shell = await connectWithRetry({ port, hostKeyHash, processHandle, dependencies })
    commandSession = await dependencies.openCommandSession({
      shell,
      user: params.settings.user,
      password: params.settings.password,
      timeoutMs: dependencies.startupTimeoutMs,
    })
    const directories = await readAgentDirectories(
      params.projectDir,
      agentBaseDir,
      dependencies
    )
    canonicalAgentBaseDir = directories.agentBaseDir
    userServiceDir = directories.userServiceDir
  } catch (caught) {
    await stopAfterFailedStart(processHandle)
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
    async exportConfiguration(outputDir, operationLogPath, signal) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      const resolvedOutputDir = await checkedOutputDir(
        canonicalAgentBaseDir,
        outputDir,
        dependencies
      )
      const stagingDir = join(userServiceDir, ".nkdk-export")
      await prepareStagingDirectory(stagingDir, dependencies)
      let commandFailure: unknown
      try {
        await commandSession.run(
          buildDumpConfigurationCommand(
            relativeAgentPath(userServiceDir, stagingDir)
          ),
          { signal }
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
          throw caught
        }
        commandFailure = caught
      }
      try {
        await moveStagingDirectory(stagingDir, resolvedOutputDir, dependencies)
      } catch {
        if (commandFailure === undefined) {
          throw new PlatformSessionError(
            "platform_command_failed",
            "Не удалось переместить выгрузку агента в каталог операции"
          )
        }
      }
      if (commandFailure !== undefined) throw commandFailure
      try {
        await dependencies.fileSystem.writeFile(
          operationLogPath,
          "Конфигурация выгружена через агент Конфигуратора\n"
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
      const result = await commandSession.run(
        buildListDesignerExtensionsCommand(),
        { signal }
      )
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
        entry["name"] === "" &&
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
      })
    } catch {
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
