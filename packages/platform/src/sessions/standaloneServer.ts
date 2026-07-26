import { join } from "node:path"
import { parse, stringify } from "yaml"
import { parseConnection } from "../infobases/parseConnection"
import {
  buildDumpConfigurationCommand,
  buildStandaloneConfigInit,
  buildStandaloneLaunch,
} from "./commands"
import { PlatformSessionError } from "./errors"
import { openPlatformCommandSession } from "./sshProtocol"
import type {
  PlatformCommandSession,
  SessionPortRuntime,
  SessionProcessRuntime,
  SshTransport,
} from "./runtime"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

export interface StandaloneServerDependencies {
  portRuntime: SessionPortRuntime
  fileSystem: {
    mkdir(path: string): Promise<void>
    writeFile(path: string, content: string): Promise<void>
  }
  processRuntime: SessionProcessRuntime
  generateHostKey(path: string): Promise<void>
  sshTransport: SshTransport
  openCommandSession: typeof openPlatformCommandSession
  platform: NodeJS.Platform
  startupTimeoutMs: number
  closeTimeoutMs: number
}

export async function createStandaloneServerSession(
  params: CreatePlatformSessionParams,
  dependencies: StandaloneServerDependencies
): Promise<PlatformSession> {
  const ibcmdPath = params.installation.ibcmdPath
  if (ibcmdPath === undefined) {
    throw missingComponent("ibcmd")
  }
  const ibsrvPath = params.installation.ibsrvPath
  if (ibsrvPath === undefined) {
    throw missingComponent("ibsrv")
  }
  const connection = parseConnection(params.settings.connectionString)
  if (connection.type !== "file") {
    throw new PlatformSessionError(
      "unsupported_connection",
      "Автономный сервер поддерживает только файловую информационную базу"
    )
  }

  const port = await dependencies.portRuntime.reservePort("127.0.0.1")
  const hostKeyPath = join(params.sessionDir, "host.key")
  const configPath = join(params.sessionDir, "config.yaml")
  await dependencies.fileSystem.mkdir(params.sessionDir)
  try {
    await dependencies.generateHostKey(hostKeyPath)
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "Не удалось подготовить ключ автономного сервера"
    )
  }

  const init = buildStandaloneConfigInit({
    ibcmdPath,
    databasePath: connection.path,
  })
  const initialized = await dependencies.processRuntime.run(init.command, init.args)
  if (initialized.exitCode !== 0) {
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd не смог подготовить конфигурацию автономного сервера"
    )
  }
  const config = prepareStandaloneConfiguration(
    initialized.stdout,
    connection.path,
    port,
    hostKeyPath
  )
  await dependencies.fileSystem.writeFile(configPath, stringify(config))

  const launch = buildStandaloneLaunch({
    ibsrvPath,
    dataDir: join(params.sessionDir, "data"),
    sessionDataDir: join(params.sessionDir, "session-data"),
    configPath,
  })
  const processHandle = dependencies.processRuntime.spawn(launch.command, launch.args)
  let commandSession: PlatformCommandSession
  try {
    await processHandle.waitForOutput("Stand-alone Server ready.", dependencies.startupTimeoutMs)
    if (!processHandle.isAlive()) {
      throw new PlatformSessionError(
        "session_start_failed",
        "Автономный сервер завершился во время запуска"
      )
    }
    const shell = await dependencies.sshTransport.connect({
      host: "127.0.0.1",
      port,
      timeoutMs: dependencies.startupTimeoutMs,
    })
    commandSession = await dependencies.openCommandSession({
      shell,
      user: params.settings.user,
      password: params.settings.password,
      timeoutMs: dependencies.startupTimeoutMs,
    })
  } catch (caught) {
    await stopAfterFailedStart(processHandle)
    if (caught instanceof PlatformSessionError) throw caught
    throw new PlatformSessionError(
      "session_timeout",
      "Истекло время запуска автономного сервера"
    )
  }

  let closed = false
  return {
    mode: "standalone-server",
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
      await ignoreCleanupError(() => commandSession.close())
      if (!processHandle.owned) return { stoppedOwnedProcess: false }
      if (!processHandle.isAlive()) return { stoppedOwnedProcess: false }
      const gracefulSignal: NodeJS.Signals =
        dependencies.platform === "win32" ? "SIGINT" : "SIGTERM"
      const signalProcess = processHandle.signal
      if (signalProcess !== undefined) {
        await ignoreCleanupError(() => signalProcess.call(processHandle, gracefulSignal))
      }
      const exited = await processHandle.wait(dependencies.closeTimeoutMs)
      if (!exited && processHandle.isAlive()) await processHandle.kill()
      return { stoppedOwnedProcess: true }
    },
  }
}

function prepareStandaloneConfiguration(
  source: string,
  databasePath: string,
  port: number,
  hostKeyPath: string
): Record<string, unknown> {
  let value: unknown
  try {
    value = parse(source)
  } catch {
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd вернул некорректную конфигурацию автономного сервера"
    )
  }
  if (!isRecord(value)) {
    throw new PlatformSessionError(
      "session_start_failed",
      "ibcmd вернул некорректную конфигурацию автономного сервера"
    )
  }
  return {
    ...value,
    database: {
      ...(isRecord(value["database"]) ? value["database"] : {}),
      path: databasePath,
    },
    gates: {
      ssh: {
        admin: {
          address: "localhost",
          port,
          "host-key": hostKeyPath,
        },
      },
    },
    features: {
      ...(isRecord(value["features"]) ? value["features"] : {}),
      "direct-gate": false,
      "http-gate": false,
      "ssh-gate": true,
    },
  }
}

function missingComponent(name: string): PlatformSessionError {
  return new PlatformSessionError(
    "platform_component_missing",
    `В установке платформы 8.3.27 не найден ${name}`
  )
}

async function stopAfterFailedStart(
  processHandle: ReturnType<SessionProcessRuntime["spawn"]>
): Promise<void> {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
