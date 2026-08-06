import { join } from "node:path"
import { PlatformSessionError } from "./errors"
import { createNodePlatformSessionManagerDependencies } from "./nodeRuntime"
import type {
  CreatePlatformSessionParams,
  NormalizedPlatformConnectionSettings,
  PlatformSession,
  PlatformSessionManager,
  PlatformSessionMode,
} from "./types"
import type { PlatformInstallation } from "../platform/findPlatform"

export interface PlatformSessionManagerDependencies {
  canonicalizeProjectDir(projectDir: string): Promise<string>
  findPlatform(): Promise<PlatformInstallation | undefined>
  createDesignerSession(params: CreatePlatformSessionParams): Promise<PlatformSession>
  createStandaloneSession(params: CreatePlatformSessionParams): Promise<PlatformSession>
  setTimer(callback: () => void, timeoutMs: number): unknown
  clearTimer(timer: unknown): void
}

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
    const outputDir = await dependencies.canonicalizeProjectDir(params.outputDir)
    const result = await withSession(params, (session) =>
      session.exportConfiguration(
        outputDir,
        params.logPath,
        params.unresolvedReferences,
        params.signal
      )
    )
    return {
      mode: result.mode,
      reusedConnection: result.reusedConnection,
    }
  }

  async function listExtensions(params: Parameters<PlatformSessionManager["listExtensions"]>[0]) {
    const result = await withSession(params, (session) => session.listExtensions(params.signal))
    return {
      extensions: result.value,
      mode: result.mode,
      reusedConnection: result.reusedConnection,
    }
  }

  async function withSession<T>(
    params: NormalizedPlatformConnectionSettings & {
      projectDir: string
      mode: PlatformSessionMode
      signal?: AbortSignal
    },
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
      } else {
        if (cached !== undefined) {
          cancelIdleTimer(cached)
          await cached.session.close()
          if (sessions.get(key) === cached) sessions.delete(key)
        }
        cached = await createSession(key, settings, mode, fingerprint)
        sessions.set(key, cached)
      }

      try {
        const value = await operation(cached.session)
        return { value, mode, reusedConnection }
      } catch (caught) {
        if (
          caught instanceof PlatformSessionError &&
          (caught.code === "operation_cancelled" ||
            caught.code === "session_timeout")
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
    fingerprint: SessionFingerprint
  ): Promise<CachedSession> {
    const installation = await dependencies.findPlatform()
    if (installation === undefined) {
      throw new PlatformSessionError("platform_not_found", "Не найдена поддерживаемая платформа 1С:Предприятие 8.3.27")
    }
    assertRequiredComponents(installation, mode)
    const sessionDir = join(
      projectDir,
      ".nkdk",
      "platform-sessions",
      mode === "designer-agent" ? "agent" : "standalone"
    )
    const createParams = { projectDir, sessionDir, installation, settings }
    const session =
      mode === "designer-agent"
        ? await dependencies.createDesignerSession(createParams)
        : await dependencies.createStandaloneSession(createParams)
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
    closeConnection,
    closeAllConnections,
  }
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
