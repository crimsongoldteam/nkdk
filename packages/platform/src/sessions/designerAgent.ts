import { join } from "node:path"
import { parseConnection } from "../infobases/parseConnection"
import { buildDesignerAgentLaunch, buildDumpConfigurationCommand } from "./commands"
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
    writeFile(path: string, content: string): Promise<void>
  }
  processRuntime: Pick<SessionProcessRuntime, "spawn">
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

  const port = await dependencies.portRuntime.reservePort("127.0.0.1")
  await dependencies.fileSystem.mkdir(params.sessionDir)
  const launch = buildDesignerAgentLaunch({
    enterprisePath,
    connection,
    baseDir: params.sessionDir,
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
  try {
    const shell = await connectWithRetry({ port, processHandle, dependencies })
    commandSession = await dependencies.openCommandSession({
      shell,
      user: params.settings.user,
      password: params.settings.password,
      timeoutMs: dependencies.startupTimeoutMs,
    })
  } catch (caught) {
    await stopAfterFailedStart(processHandle)
    throw caught
  }

  let closed = false
  return {
    mode: "designer-agent",
    ownedProcess: processHandle.owned,
    isAlive() {
      return !closed && processHandle.isAlive() && commandSession.isAlive()
    },
    async exportConfiguration(outputDir, operationLogPath) {
      if (closed) {
        throw new PlatformSessionError("platform_command_failed", "Соединение с платформой закрыто")
      }
      await commandSession.run(buildDumpConfigurationCommand(outputDir))
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
    async close() {
      if (closed) return { stoppedOwnedProcess: false }
      closed = true
      await ignoreCleanupError(() => commandSession.run("common disconnect-ib"))
      await ignoreCleanupError(() => commandSession.run("common shutdown"))
      await ignoreCleanupError(() => commandSession.close())
      if (!processHandle.owned) {
        await ignoreCleanupError(() => processHandle.wait(dependencies.closeTimeoutMs))
        return { stoppedOwnedProcess: false }
      }
      if (!processHandle.isAlive()) return { stoppedOwnedProcess: false }
      const exited = await processHandle.wait(dependencies.closeTimeoutMs)
      if (!exited && processHandle.isAlive()) await processHandle.kill()
      return { stoppedOwnedProcess: true }
    },
  }
}

async function connectWithRetry(params: {
  port: number
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
