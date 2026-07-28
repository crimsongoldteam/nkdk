import { describe, expect, it, vi } from "vitest"
import { PlatformSessionError } from "./errors"
import type { ExportConfigurationParams, ListConfigurationExtensionsParams, PlatformSession } from "./types"
import { createPlatformSessionManager, type PlatformSessionManagerDependencies } from "./manager"

describe("platform session manager", () => {
  it("reuses one healthy session with the same private fingerprint", async () => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)

    await expect(manager.exportConfiguration(exportParams())).resolves.toMatchObject({
      mode: "designer-agent",
      reusedConnection: false,
    })
    await expect(manager.exportConfiguration(exportParams())).resolves.toMatchObject({
      mode: "designer-agent",
      reusedConnection: true,
    })
    expect(fixture.created).toHaveLength(1)
  })

  it("reuses an exported session to list extensions", async () => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())

    await expect(manager.listExtensions(listParams())).resolves.toEqual({
      extensions: [listedExtension],
      mode: "designer-agent",
      reusedConnection: true,
    })
    expect(fixture.created).toHaveLength(1)
    expect(fixture.listStarts).toEqual(["/project:1"])
  })

  it("serializes extension listing with other operations of one project", async () => {
    const pending = deferred<void>()
    const fixture = createFixture({
      exportHook: async () => pending.promise,
    })
    const manager = createPlatformSessionManager(fixture.dependencies)

    const exporting = manager.exportConfiguration(exportParams())
    await vi.waitFor(() => expect(fixture.exportStarts).toEqual(["/project:1"]))
    const listing = manager.listExtensions(listParams())
    expect(fixture.listStarts).toEqual([])

    pending.resolve()
    await exporting
    await listing
    expect(fixture.listStarts).toEqual(["/project:1"])
  })

  it("cancels and replaces a session after an aborted extension list", async () => {
    const fixture = createFixture({
      listHook: async (_projectDir, _call, signal) => {
        if (signal === undefined) throw new Error("signal missing")
        throw new PlatformSessionError("operation_cancelled", "operation cancelled")
      },
    })
    const manager = createPlatformSessionManager(fixture.dependencies)
    const controller = new AbortController()

    await expect(manager.listExtensions(listParams({ signal: controller.signal }))).rejects.toMatchObject({
      code: "operation_cancelled",
    })
    expect(fixture.sessions[0]?.cancelCalls).toBe(1)
    expect(fixture.activeTimers()).toEqual([])

    fixture.options.listHook = undefined
    await expect(manager.listExtensions(listParams())).resolves.toMatchObject({
      reusedConnection: false,
    })
    expect(fixture.created).toHaveLength(2)
  })

  it("cancels and replaces a session after an extension list timeout", async () => {
    const fixture = createFixture({
      listHook: async () => {
        throw new PlatformSessionError("session_timeout", "operation timed out")
      },
    })
    const manager = createPlatformSessionManager(fixture.dependencies)

    await expect(manager.listExtensions(listParams())).rejects.toMatchObject({
      code: "session_timeout",
    })
    expect(fixture.sessions[0]?.cancelCalls).toBe(1)
    expect(fixture.activeTimers()).toEqual([])

    fixture.options.listHook = undefined
    await expect(manager.listExtensions(listParams())).resolves.toMatchObject({
      reusedConnection: false,
    })
    expect(fixture.created).toHaveLength(2)
  })

  it("passes a canonical output directory to the platform session", async () => {
    const fixture = createFixture()
    fixture.dependencies.canonicalizeProjectDir = async (path) => path.replace(/^\/var\//, "/private/var/")
    const manager = createPlatformSessionManager(fixture.dependencies)

    await manager.exportConfiguration(exportParams({}, "/var/project"))

    expect(fixture.exportedOutputDirs).toEqual(["/private/var/project/.nkdk/tmp/op/xml"])
  })

  it.each([
    { connectionString: 'File="/bases/other";' },
    { user: "Другой" },
    { password: "other-secret" },
    { useStandaloneServer: true },
  ])("replaces a session when its fingerprint changes: %s", async (change) => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())

    await expect(manager.exportConfiguration(exportParams(change))).resolves.toMatchObject({
      reusedConnection: false,
    })

    expect(fixture.created).toHaveLength(2)
    expect(fixture.sessions[0]?.closeCalls).toBe(1)
  })

  it("replaces an offline session when database credentials change", async () => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)
    const database = {
      dbms: "PostgreSQL" as const,
      server: "db",
      name: "base",
      user: "dbuser",
      password: "first",
    }
    const params = {
      connectionString: 'Srvr="cluster";Ref="base";',
      useStandaloneServer: true,
      database,
    }
    await manager.exportConfiguration(exportParams(params))

    await expect(
      manager.exportConfiguration(exportParams({ ...params, database: { ...database, password: "second" } }))
    ).resolves.toMatchObject({ reusedConnection: false })

    expect(fixture.created).toHaveLength(2)
    expect(fixture.sessions[0]?.closeCalls).toBe(1)
  })

  it("replaces a dead cached session", async () => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())
    fixture.sessions[0]?.markDead()

    await manager.exportConfiguration(exportParams())

    expect(fixture.created).toHaveLength(2)
  })

  it("serializes one project and lets different projects run concurrently", async () => {
    const first = deferred<void>()
    const fixture = createFixture({
      exportHook: async (projectDir, call) => {
        if (projectDir === "/project" && call === 1) await first.promise
      },
    })
    const manager = createPlatformSessionManager(fixture.dependencies)

    const sameFirst = manager.exportConfiguration(exportParams())
    const sameSecond = manager.exportConfiguration(exportParams())
    await vi.waitFor(() => expect(fixture.exportStarts).toEqual(["/project:1"]))

    const other = manager.exportConfiguration(exportParams({}, "/other"))
    await vi.waitFor(() => expect(fixture.exportStarts).toContain("/other:1"))
    expect(fixture.exportStarts).not.toContain("/project:2")

    first.resolve()
    await Promise.all([sameFirst, sameSecond, other])
    expect(fixture.exportStarts).toContain("/project:2")
  })

  it("does not arm idle close during work and resets it after each operation", async () => {
    const pending = deferred<void>()
    const fixture = createFixture({
      exportHook: async (_projectDir, call) => {
        if (call === 1) await pending.promise
      },
    })
    const manager = createPlatformSessionManager(fixture.dependencies)
    const first = manager.exportConfiguration(exportParams({ sessionIdleTimeout: 12 }))
    await vi.waitFor(() => expect(fixture.exportStarts).toHaveLength(1))
    expect(fixture.activeTimers()).toEqual([])

    pending.resolve()
    await first
    expect(fixture.activeTimers()).toEqual([12_000])
    await manager.exportConfiguration(exportParams({ sessionIdleTimeout: 30 }))
    expect(fixture.activeTimers()).toEqual([30_000])

    fixture.expireLatestTimer()
    await vi.waitFor(() => expect(fixture.sessions[0]?.closeCalls).toBe(1))
  })

  it("idle timeout closes by canonical key even if the project path disappears", async () => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())
    fixture.dependencies.canonicalizeProjectDir = async () => {
      throw new Error("project disappeared")
    }

    fixture.expireLatestTimer()

    await vi.waitFor(() => expect(fixture.sessions[0]?.closeCalls).toBe(1))
  })

  it("recovers a project queue after an export rejection", async () => {
    const fixture = createFixture({
      exportHook: async (_projectDir, call) => {
        if (call === 1) throw new Error("failed")
      },
    })
    const manager = createPlatformSessionManager(fixture.dependencies)

    await expect(manager.exportConfiguration(exportParams())).rejects.toThrow("failed")
    await expect(manager.exportConfiguration(exportParams())).resolves.toMatchObject({
      reusedConnection: true,
    })
  })

  it("closes one connection and reports an absent project", async () => {
    const fixture = createFixture()
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())

    await expect(manager.closeConnection("/project")).resolves.toEqual({
      closed: true,
      stoppedOwnedProcess: true,
    })
    await expect(manager.closeConnection("/project")).resolves.toEqual({
      closed: false,
      stoppedOwnedProcess: false,
    })
  })

  it("closes all projects independently when one close fails", async () => {
    const fixture = createFixture({ closeFailureProject: "/broken" })
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams({}, "/broken"))
    await manager.exportConfiguration(exportParams({}, "/healthy"))

    await expect(manager.closeAllConnections()).resolves.toEqual({
      closedCount: 1,
      stoppedOwnedProcesses: 1,
    })
    expect(fixture.sessions).toHaveLength(2)
    expect(fixture.sessions.every((session) => session.closeCalls === 1)).toBe(true)
  })

  it("keeps a failed close available for retry", async () => {
    const fixture = createFixture({ closeFailureProject: "/project" })
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())

    await expect(manager.closeConnection("/project")).rejects.toThrow("close failed")
    await expect(manager.closeConnection("/project")).resolves.toEqual({
      closed: true,
      stoppedOwnedProcess: true,
    })
    expect(fixture.sessions[0]?.closeCalls).toBe(2)
  })

  it("keeps a session available when replacement close fails", async () => {
    const fixture = createFixture({ closeFailureProject: "/project" })
    const manager = createPlatformSessionManager(fixture.dependencies)
    await manager.exportConfiguration(exportParams())

    await expect(manager.exportConfiguration(exportParams({ password: "new-secret" }))).rejects.toThrow("close failed")
    await expect(manager.closeConnection("/project")).resolves.toEqual({
      closed: true,
      stoppedOwnedProcess: true,
    })
    expect(fixture.sessions[0]?.closeCalls).toBe(2)
  })

  it("cancels and replaces a session after an aborted export", async () => {
    let blockFirstExport = true
    const fixture = createFixture({
      cancelFailures: 1,
      exportHook: async (_projectDir, _call, signal) => {
        if (!blockFirstExport) return
        blockFirstExport = false
        if (signal === undefined) throw new Error("signal missing")
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new PlatformSessionError("operation_cancelled", "operation cancelled")),
            { once: true }
          )
        })
      },
    })
    const manager = createPlatformSessionManager(fixture.dependencies)
    const controller = new AbortController()

    const first = manager.exportConfiguration(exportParams({ signal: controller.signal }))
    const firstResult = expect(first).rejects.toMatchObject({
      code: "operation_cancelled",
    })
    await vi.waitFor(() => expect(fixture.exportStarts).toEqual(["/project:1"]))
    controller.abort()

    await firstResult
    expect(fixture.sessions[0]?.cancelCalls).toBe(1)
    expect(fixture.activeTimers()).toEqual([])

    await expect(manager.exportConfiguration(exportParams())).resolves.toMatchObject({
      reusedConnection: false,
    })
    expect(fixture.created).toHaveLength(2)
    expect(fixture.activeTimers()).toEqual([900_000])
  })
})

function exportParams(overrides: Partial<ExportConfigurationParams> = {}, projectDir = "/project") {
  return { ...baseExportParams(projectDir), ...overrides }
}

function listParams(overrides: Partial<ListConfigurationExtensionsParams> = {}, projectDir = "/project") {
  const { outputDir: _outputDir, logPath: _logPath, ...params } = baseExportParams(projectDir)
  return { ...params, ...overrides }
}

function baseExportParams(projectDir: string) {
  return {
    projectDir,
    outputDir: `${projectDir}/.nkdk/tmp/op/xml`,
    logPath: `${projectDir}/.nkdk/tmp/op/platform.log`,
    connectionString: 'File="/bases/demo";',
    user: "Администратор",
    password: "secret",
    useStandaloneServer: false,
    sessionIdleTimeout: 900,
  }
}

type FakeSession = PlatformSession & {
  projectDir: string
  closeCalls: number
  cancelCalls: number
  cancel(): Promise<{ stoppedOwnedProcess: boolean }>
  markDead(): void
}

function createFixture(
  options: {
    exportHook?: (projectDir: string, call: number, signal?: AbortSignal) => Promise<void>
    closeFailureProject?: string
    cancelFailures?: number
    listHook?: (projectDir: string, call: number, signal?: AbortSignal) => Promise<void>
  } = {}
): {
  dependencies: PlatformSessionManagerDependencies
  created: string[]
  sessions: FakeSession[]
  exportStarts: string[]
  listStarts: string[]
  exportedOutputDirs: string[]
  options: {
    listHook?: (projectDir: string, call: number, signal?: AbortSignal) => Promise<void>
  }
  activeTimers(): number[]
  expireLatestTimer(): void
} {
  const created: string[] = []
  const sessions: FakeSession[] = []
  const exportStarts: string[] = []
  const listStarts: string[] = []
  const exportedOutputDirs: string[] = []
  let cancelFailures = options.cancelFailures ?? 0
  let timerId = 0
  const timers = new Map<number, { callback: () => void; timeoutMs: number }>()
  const createSession = async (params: { projectDir: string }, mode: PlatformSession["mode"]) => {
    created.push(`${params.projectDir}:${mode}`)
    let alive = true
    let exportCalls = 0
    let listCalls = 0
    const session: FakeSession = {
      projectDir: params.projectDir,
      mode,
      ownedProcess: true,
      closeCalls: 0,
      cancelCalls: 0,
      async exportConfiguration(outputDir, _operationLogPath, signal) {
        exportCalls += 1
        exportStarts.push(`${params.projectDir}:${exportCalls}`)
        exportedOutputDirs.push(outputDir)
        await options.exportHook?.(params.projectDir, exportCalls, signal)
      },
      async listExtensions(signal) {
        listCalls += 1
        listStarts.push(`${params.projectDir}:${listCalls}`)
        await options.listHook?.(params.projectDir, listCalls, signal)
        return [listedExtension]
      },
      isAlive: () => alive,
      async close() {
        session.closeCalls += 1
        alive = false
        if (params.projectDir === options.closeFailureProject && session.closeCalls === 1) {
          alive = true
          throw new Error("close failed")
        }
        return { stoppedOwnedProcess: true }
      },
      async cancel() {
        session.cancelCalls += 1
        if (cancelFailures > 0) {
          cancelFailures -= 1
          throw new Error("cancel failed")
        }
        alive = false
        return { stoppedOwnedProcess: true }
      },
      markDead() {
        alive = false
      },
    }
    sessions.push(session)
    return session
  }
  return {
    created,
    sessions,
    exportStarts,
    listStarts,
    exportedOutputDirs,
    options,
    dependencies: {
      canonicalizeProjectDir: async (projectDir) => projectDir.replace(/\/+$/, ""),
      findPlatform: async () => ({
        version: "8.3.27.2214",
        directory: "/opt/1cv8",
        enterprisePath: "1cv8",
        ibcmdPath: "ibcmd",
        ibsrvPath: "ibsrv",
      }),
      createDesignerSession: (params) => createSession(params, "designer-agent"),
      createStandaloneSession: (params) => createSession(params, "standalone-server"),
      setTimer(callback, timeoutMs) {
        timerId += 1
        timers.set(timerId, { callback, timeoutMs })
        return timerId
      },
      clearTimer(timer) {
        timers.delete(Number(timer))
      },
    },
    activeTimers: () => [...timers.values()].map((timer) => timer.timeoutMs),
    expireLatestTimer() {
      const latest = [...timers.entries()].at(-1)
      if (latest === undefined) throw new Error("timer missing")
      timers.delete(latest[0])
      latest[1].callback()
    },
  }
}

const listedExtension = {
  name: "Extension",
  version: "",
  active: true,
  purpose: "customization" as const,
  safeMode: true,
  securityProfileName: "",
  unsafeActionProtection: true,
  usedInDistributedInfobase: false,
  scope: "infobase" as const,
  hashSum: "hash",
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })
  return { promise, resolve, reject }
}
