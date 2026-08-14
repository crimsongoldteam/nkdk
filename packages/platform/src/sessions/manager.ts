import { join } from "node:path"
import { parseConnection } from "../infobases/parseConnection"
import { PlatformSessionError } from "./errors"
import { createNodePlatformSessionManagerDependencies } from "./nodeRuntime"
import { platformFailure, type PlatformOperationLog } from "./operationLog"
import type {
  NormalizedPlatformConnectionSettings,
  PlatformSession,
  PlatformSessionManager,
  PlatformSessionMode,
} from "./types"
import type { PlatformInstallation } from "../platform/findPlatform"
import type { PlatformSessionManagerDependencies } from "./contracts"

export type { PlatformSessionManagerDependencies } from "./contracts"

type SessionFingerprint = {
  connectionString: string
  user?: string
  password?: string
  database?: NormalizedPlatformConnectionSettings["database"]
  mode: PlatformSessionMode
}

type CachedSession = {
  session: PlatformSession
  fingerprint: SessionFingerprint
  timer?: unknown
}

export function createPlatformSessionManager(
  dependencies: PlatformSessionManagerDependencies = createNodePlatformSessionManagerDependencies()
): PlatformSessionManager {
  const sessions = new Map<string, CachedSession>()
  const queues = new Map<string, Promise<void>>()
  const pendingOperations = new Map<string, number>()

  async function exportConfiguration(params: Parameters<PlatformSessionManager["exportConfiguration"]>[0]) {
    const operationLog = await openOperationLog(params, params.mode)
    await appendRequired(
      operationLog,
      [
        `operation mode=${params.mode}`,
        `connection=${connectionKind(params.connectionString)}`,
        `infobase-auth=${params.user === undefined ? "os" : "credentials"}`,
        `database-auth=${databaseAuthenticationKind(params.database)}`,
      ].join(" "),
      params.mode
    )
    const outputDir = await dependencies.canonicalizeProjectDir(params.outputDir)
    const result = await withSession(params, operationLog, (session) =>
      session.exportConfiguration(
        outputDir,
        operationLog,
        params.unresolvedReferences,
        params.signal,
        params.extensionName
      )
    )
    return {
      mode: result.mode,
      reusedConnection: result.reusedConnection,
    }
  }

  async function listExtensions(params: Parameters<PlatformSessionManager["listExtensions"]>[0]) {
    const result = await withSession(params, undefined, (session) => session.listExtensions(params.signal))
    return {
      extensions: result.value,
      mode: result.mode,
      reusedConnection: result.reusedConnection,
    }
  }

  async function loadPartialConfiguration(
    params: Parameters<PlatformSessionManager["loadPartialConfiguration"]>[0]
  ) {
    const mode = "designer-agent" as const
    const operationLog = await openOperationLog(params, mode)
    await appendRequired(
      operationLog,
      [
        `operation mode=${mode} stage=configuration-load`,
        `connection=${connectionKind(params.connectionString)}`,
        `infobase-auth=${params.user === undefined ? "os" : "credentials"}`,
        `database-auth=${databaseAuthenticationKind(params.database)}`,
      ].join(" "),
      mode
    )
    await appendRequired(operationLog, "pending-phase=transferring", mode)
    const result = await withSession(
      { ...params, mode },
      operationLog,
      (session) => {
        if (session.loadPartialConfiguration === undefined) {
          throw new PlatformSessionError(
            "platform_component_missing",
            "Сеанс платформы не поддерживает частичную загрузку"
          )
        }
        return session.loadPartialConfiguration(
          params.archivePath,
          params.loadTargets,
          operationLog,
          params.extensionName,
          params.signal
        )
      }
    )
    return {
      mode,
      reusedConnection: result.reusedConnection,
      warnings: result.value.warnings,
    }
  }

  async function withSession<T>(
    params: NormalizedPlatformConnectionSettings & {
      projectDir: string
      mode: PlatformSessionMode
      signal?: AbortSignal
    },
    operationLog: PlatformOperationLog | undefined,
    operation: (session: PlatformSession) => Promise<T>
  ): Promise<{
    value: T
    mode: PlatformSessionMode
    reusedConnection: boolean
  }> {
    const key = await dependencies.canonicalizeProjectDir(params.projectDir)
    return enqueue(key, async () => {
      throwIfCancelled(params.signal)
      const settings: NormalizedPlatformConnectionSettings = params
      const mode = params.mode
      const fingerprint = createFingerprint(settings, mode)
      let cached = sessions.get(key)
      let reusedConnection = false
      if (cached !== undefined && cached.session.isAlive() && fingerprintsEqual(cached.fingerprint, fingerprint)) {
        cancelIdleTimer(cached)
        reusedConnection = true
        if (operationLog !== undefined) await appendRequired(operationLog, "connection reused=true", mode)
      } else {
        if (cached !== undefined) {
          cancelIdleTimer(cached)
          await cached.session.close()
          if (sessions.get(key) === cached) sessions.delete(key)
        }
        if (operationLog !== undefined) await appendRequired(operationLog, "connection reused=false", mode)
        cached = await createSession(key, settings, mode, fingerprint, operationLog)
        sessions.set(key, cached)
      }

      try {
        const value = await operation(cached.session)
        return { value, mode, reusedConnection }
      } catch (caught) {
        if (
          caught instanceof PlatformSessionError &&
          (caught.code === "operation_cancelled" ||
            caught.code === "session_timeout" ||
            caught.code === "delivery_outcome_unknown")
        ) {
          try {
            await cached.session.cancel()
          } catch {
            try {
              await cached.session.close()
            } catch {
              // Исходная ошибка операции важнее ошибки повторной очистки.
            }
          } finally {
            if (sessions.get(key) === cached) sessions.delete(key)
          }
        }
        throw caught
      } finally {
        if (sessions.get(key) === cached && (pendingOperations.get(key) ?? 0) <= 1) {
          armIdleTimer(key, cached, settings.sessionIdleTimeout)
        }
      }
    })
  }

  async function closeConnection(projectDir: string) {
    const key = await dependencies.canonicalizeProjectDir(projectDir)
    return enqueue(key, () => closeCanonicalConnection(key))
  }

  async function closeAllConnections() {
    const keys = [...sessions.keys()]
    const results = await Promise.allSettled(keys.map((key) => enqueue(key, () => closeCanonicalConnection(key))))
    let closedCount = 0
    let stoppedOwnedProcesses = 0
    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value.closed) continue
      closedCount += 1
      if (result.value.stoppedOwnedProcess) stoppedOwnedProcesses += 1
    }
    return { closedCount, stoppedOwnedProcesses }
  }

  async function createSession(
    projectDir: string,
    settings: NormalizedPlatformConnectionSettings,
    mode: PlatformSessionMode,
    fingerprint: SessionFingerprint,
    operationLog?: PlatformOperationLog
  ): Promise<CachedSession> {
    if (operationLog !== undefined) {
      await appendRequired(operationLog, "stage=platform-discovery status=start", mode)
    }
    let installation: PlatformInstallation | undefined
    try {
      installation = await dependencies.findPlatform()
    } catch (cause) {
      if (operationLog === undefined) throw cause
      throw await platformFailure({
        code: "platform_not_found",
        stage: "platform-discovery",
        mode,
        log: operationLog,
        platformText: cause instanceof Error ? cause.message : "",
        fallbackMessage: "Не удалось найти платформу 1С:Предприятие",
        cause,
      })
    }
    if (installation === undefined) {
      if (operationLog !== undefined) {
        throw await platformFailure({
          code: "platform_not_found",
          stage: "platform-discovery",
          mode,
          log: operationLog,
          platformText: "",
          fallbackMessage: "Не найдена поддерживаемая платформа 1С:Предприятие 8.3.27",
        })
      }
      throw new PlatformSessionError("platform_not_found", "Не найдена поддерживаемая платформа 1С:Предприятие 8.3.27")
    }
    try {
      assertRequiredComponents(installation, mode)
    } catch (cause) {
      if (operationLog === undefined || !(cause instanceof PlatformSessionError)) throw cause
      throw await platformFailure({
        code: cause.code,
        stage: "platform-discovery",
        mode,
        log: operationLog,
        platformText: cause.message,
        fallbackMessage: cause.message,
        cause,
      })
    }
    if (operationLog !== undefined) {
      await appendRequired(operationLog, "stage=platform-discovery status=ready", mode)
      await appendRequired(operationLog, "stage=session-start status=start", mode)
    }
    const sessionDir = join(
      projectDir,
      ".nkdk",
      "platform-sessions",
      mode === "designer-agent" ? "agent" : "standalone"
    )
    const createParams = {
      projectDir,
      sessionDir,
      installation,
      settings,
      ...(operationLog === undefined ? {} : { operationLog }),
    }
    let session: PlatformSession
    try {
      session = mode === "designer-agent"
        ? await dependencies.createDesignerSession(createParams)
        : await dependencies.createStandaloneSession(createParams)
    } catch (cause) {
      if (
        operationLog === undefined ||
        (cause instanceof PlatformSessionError && cause.details !== undefined)
      ) throw cause
      const code = cause instanceof PlatformSessionError ? cause.code : "session_start_failed"
      throw await platformFailure({
        code,
        stage: "session-start",
        mode,
        log: operationLog,
        platformText: cause instanceof Error ? cause.message : "",
        fallbackMessage: "Не удалось открыть подключение к платформе",
        cause,
      })
    }
    if (operationLog !== undefined) {
      await appendRequired(operationLog, "stage=session-start status=ready", mode)
    }
    return { session, fingerprint }
  }

  async function closeCanonicalConnection(key: string) {
    const cached = sessions.get(key)
    if (cached === undefined) return { closed: false, stoppedOwnedProcess: false }
    cancelIdleTimer(cached)
    const result = await cached.session.close()
    if (sessions.get(key) === cached) sessions.delete(key)
    return { closed: true, stoppedOwnedProcess: result.stoppedOwnedProcess }
  }

  function armIdleTimer(key: string, cached: CachedSession, timeoutSeconds: number): void {
    cancelIdleTimer(cached)
    cached.timer = dependencies.setTimer(() => {
      cached.timer = undefined
      void enqueue(key, () => closeCanonicalConnection(key)).catch(() => undefined)
    }, timeoutSeconds * 1000)
  }

  function cancelIdleTimer(cached: CachedSession): void {
    if (cached.timer === undefined) return
    dependencies.clearTimer(cached.timer)
    cached.timer = undefined
  }

  function enqueue<T>(key: string, operation: () => Promise<T>): Promise<T> {
    pendingOperations.set(key, (pendingOperations.get(key) ?? 0) + 1)
    const previous = queues.get(key) ?? Promise.resolve()
    const result = previous.catch(() => undefined).then(operation)
    const tail = result.then(
      () => undefined,
      () => undefined
    )
    queues.set(key, tail)
    return result.finally(() => {
      const remaining = (pendingOperations.get(key) ?? 1) - 1
      if (remaining === 0) pendingOperations.delete(key)
      else pendingOperations.set(key, remaining)
      if (queues.get(key) === tail) queues.delete(key)
    })
  }

  return {
    exportConfiguration,
    listExtensions,
    loadPartialConfiguration,
    closeConnection,
    closeAllConnections,
  }

  async function openOperationLog(
    params: { logPath: string; password?: string; database?: NormalizedPlatformConnectionSettings["database"] },
    mode: PlatformSessionMode = "designer-agent"
  ): Promise<PlatformOperationLog> {
    try {
      return await dependencies.createOperationLog({
        path: params.logPath,
        secrets: [params.password, params.database?.password].filter(
          (value): value is string => value !== undefined
        ),
      })
    } catch (cause) {
      throw new PlatformSessionError(
        "platform_command_failed",
        "Не удалось создать журнал операции платформы",
        { cause, details: { stage: "platform-log", mode } }
      )
    }
  }
}

async function appendRequired(
  operationLog: PlatformOperationLog,
  message: string,
  mode: PlatformSessionMode
): Promise<void> {
  if (await operationLog.append(message)) return
  throw await platformFailure({
    code: "platform_command_failed",
    stage: "platform-log",
    mode,
    log: operationLog,
    platformText: "",
    fallbackMessage: "Не удалось записать журнал операции платформы",
  })
}

function connectionKind(connectionString: string): string {
  return parseConnection(connectionString).type
}

function databaseAuthenticationKind(
  database: NormalizedPlatformConnectionSettings["database"]
): string {
  if (database === undefined) return "none"
  return database.user === undefined ? "os" : "credentials"
}

function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted !== true) return
  throw new PlatformSessionError("operation_cancelled", "Операция платформы отменена")
}

function createFingerprint(
  settings: NormalizedPlatformConnectionSettings,
  mode: PlatformSessionMode
): SessionFingerprint {
  return {
    connectionString: settings.connectionString,
    ...(settings.user === undefined ? {} : { user: settings.user }),
    ...(settings.password === undefined ? {} : { password: settings.password }),
    ...(settings.database === undefined ? {} : { database: settings.database }),
    mode,
  }
}

function fingerprintsEqual(left: SessionFingerprint, right: SessionFingerprint): boolean {
  return (
    left.connectionString === right.connectionString &&
    left.user === right.user &&
    left.password === right.password &&
    databaseSettingsEqual(left.database, right.database) &&
    left.mode === right.mode
  )
}

function databaseSettingsEqual(
  left: NormalizedPlatformConnectionSettings["database"],
  right: NormalizedPlatformConnectionSettings["database"]
): boolean {
  if (left === undefined || right === undefined) return left === right
  return (
    left.dbms === right.dbms &&
    left.server === right.server &&
    left.name === right.name &&
    left.user === right.user &&
    left.password === right.password
  )
}

function assertRequiredComponents(installation: PlatformInstallation, mode: PlatformSessionMode): void {
  if (mode === "designer-agent" && installation.enterprisePath === undefined) {
    throw missingComponent("1cv8")
  }
  if (mode === "standalone-server" && installation.ibcmdPath === undefined) {
    throw missingComponent("ibcmd")
  }
}

function missingComponent(name: string): PlatformSessionError {
  return new PlatformSessionError("platform_component_missing", `В установке платформы 8.3.27 не найден ${name}`)
}
