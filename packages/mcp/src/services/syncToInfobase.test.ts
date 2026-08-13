import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "@nkdk/platform"
import {
  syncToInfobase,
  type SyncToInfobaseDependencies,
} from "./syncToInfobase"

const attemptDirectory = join("/project", ".nkdk", "tmp", "sync-to-infobase", "attempt-1")
const logPath = join(attemptDirectory, "platform.log")

describe("sync to infobase", () => {
  it("requires confirmation before reading project state or settings", async () => {
    const fixture = createFixture()

    await expect(syncToInfobase({ projectDir: "/project" }, fixture.dependencies)).resolves.toMatchObject({
      ok: false,
      code: "confirmation_required",
    })
    expect(fixture.events).toEqual([])
  })

  it("returns project settings diagnostics before preparing a package", async () => {
    const fixture = createFixture({
      settings: {
        status: "missing",
        projectDir: "/project",
        settingsPath: "/project/.nkdk/project.yaml",
      },
    })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: false,
      code: "project_settings_required",
    })
    expect(fixture.events).toEqual(["readSettings"])
  })

  it("does not call the platform when the component is unchanged", async () => {
    const fixture = createFixture({ prepare: unchangedResult() })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toEqual({
      ok: true,
      status: "unchanged",
      componentPath: "cf",
      diagnostics: [],
    })
    expect(fixture.events).toEqual(["readSettings", "resolveComponent", "readPending", "prepare"])
  })

  it("blocks a new attempt while the previous delivery outcome is unknown", async () => {
    const fixture = createFixture({ pendingStatus: "transferring" })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toEqual({
      ok: false,
      code: "delivery_outcome_unknown",
      message: "Результат предыдущей передачи неизвестен; автоматический повтор запрещён",
      details: {
        packageId: "package-1",
        componentPath: "cf",
        temporaryDirectory: attemptDirectory,
        stage: "configuration-load",
        mode: "designer-agent",
        log: { uri: pathToFileURL(logPath).href, format: "text/plain" },
      },
    })
    expect(fixture.events).toEqual(["readSettings", "resolveComponent", "readPending"])
  })

  it("only finalizes a package whose platform load was confirmed", async () => {
    const fixture = createFixture({ pendingStatus: "applied" })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: true,
      status: "synchronized",
      packageId: "package-1",
      entries: ["Catalogs/Test.xml", "load.lst"],
      loadTargets: ["Catalogs/Test.xml"],
      finalizeStatus: "alreadyPublished",
    })
    expect(fixture.events).toEqual([
      "readSettings",
      "resolveComponent",
      "readPending",
      "finalize",
      `rm ${attemptDirectory}`,
    ])
  })

  it("records transferring before the command, then applied before finalize", async () => {
    const fixture = createFixture()

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: true,
      status: "synchronized",
      mode: "designer-agent",
      reusedConnection: false,
      configurationIndexPath: "/project/.nkdk/configuration-index/cf.bin",
    })
    expect(fixture.events).toEqual([
      "readSettings",
      "resolveComponent",
      "readPending",
      "prepare",
      `mkdir ${attemptDirectory}`,
      "markTransferring",
      "platformLoad",
      "markApplied",
      "recordPhase applied",
      "finalize",
      `rm ${attemptDirectory}`,
    ])
    expect(fixture.platformParams).toMatchObject({
      projectDir: "/project",
      archivePath: "/project/.nkdk/tmp/incremental-sync/cf/package-1.zip",
      loadTargets: ["Catalogs/Test.xml"],
      logPath,
      connectionString: "File=/base",
    })
    expect(fixture.platformParams).not.toHaveProperty("operations")
  })

  it("передаёт имя расширения без условий по виду метаданных", async () => {
    const fixture = createFixture()

    await expect(syncToInfobase(
      { projectDir: "/project", componentPath: "cfe/Расширение", allowWrite: true },
      fixture.dependencies,
    )).resolves.toMatchObject({ ok: true, componentPath: "cfe/Расширение" })

    expect(fixture.platformParams).toMatchObject({ extensionName: "Расширение" })
  })

  it("returns a confirmed platform rejection to prepared", async () => {
    const fixture = createFixture({
      platformError: new PlatformSessionError("platform_command_failed", "XML отклонён", {
        commandOutcome: "rejected",
        details: { stage: "configuration-load", mode: "designer-agent", logPath },
      }),
    })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: false,
      code: "platform_command_failed",
      message: "XML отклонён",
      details: { packageId: "package-1", temporaryDirectory: attemptDirectory },
    })
    expect(fixture.events).toContain("markPreparedAfterRejection")
    expect(fixture.events).toContain("recordPhase prepared")
    expect(fixture.events).not.toContain("markApplied")
  })

  it("сохраняет подтверждённый отказ при ошибке записи конечной фазы", async () => {
    const fixture = createFixture({
      platformError: new PlatformSessionError("platform_command_failed", "XML отклонён", {
        commandOutcome: "rejected",
        details: { stage: "configuration-load", mode: "designer-agent", logPath },
      }),
      recordPhaseError: new Error("log unavailable"),
    })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: false,
      code: "platform_command_failed",
      message: "XML отклонён",
    })
  })

  it("keeps transferring when the platform outcome is unknown", async () => {
    const fixture = createFixture({
      platformError: new PlatformSessionError("delivery_outcome_unknown", "Связь потеряна", {
        commandOutcome: "unknown",
        details: { stage: "configuration-load", mode: "designer-agent", logPath },
      }),
    })

    expectUnknownDelivery(await syncToInfobase(input(), fixture.dependencies))
    expect(fixture.events).not.toContain("markPreparedAfterRejection")
  })

  it("does not expose a log link when the platform did not create one", async () => {
    const fixture = createFixture({
      platformError: new PlatformSessionError("platform_command_failed", "Журнал недоступен", {
        details: { stage: "platform-log", mode: "designer-agent" },
      }),
    })

    const result = await syncToInfobase(input(), fixture.dependencies)

    expect(result).toMatchObject({ ok: false, code: "platform_command_failed" })
    expect(result.details).not.toHaveProperty("log")
  })

  it("treats an applied-state write failure after platform success as unknown", async () => {
    const fixture = createFixture({ markAppliedError: new Error("disk failure") })

    expectUnknownDelivery(await syncToInfobase(input(), fixture.dependencies))
    expect(fixture.events).not.toContain("finalize")
  })

  it("retries only finalize after its first failure", async () => {
    const fixture = createFixture({ finalizeFailures: 1 })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: false,
      code: "core_error",
      details: { packageId: "package-1", temporaryDirectory: attemptDirectory },
    })
    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: true,
      status: "synchronized",
    })
    expect(fixture.events.filter((event) => event === "platformLoad")).toHaveLength(1)
    expect(fixture.events.filter((event) => event === "finalize")).toHaveLength(2)
  })

  it("reports cleanup failure as a warning after successful synchronization", async () => {
    const fixture = createFixture({ cleanupError: new Error("busy") })

    await expect(syncToInfobase(input(), fixture.dependencies)).resolves.toMatchObject({
      ok: true,
      status: "synchronized",
      warnings: [expect.objectContaining({ code: "temporary_directory_cleanup_failed" })],
    })
  })

  it.each([
    { paths: "одинаковом пути", secondProjectDir: "/project" },
    { paths: "настоящем пути и ссылке", secondProjectDir: "/project-link" },
  ])("последовательно выполняет два полных цикла при $paths", async ({ secondProjectDir }) => {
    let releaseFirstLoad!: () => void
    const firstLoad = new Promise<void>((resolve) => { releaseFirstLoad = resolve })
    let firstLoadStarted!: () => void
    const started = new Promise<void>((resolve) => { firstLoadStarted = resolve })
    let calls = 0
    const fixture = createFixture({
      async platformLoad() {
        calls += 1
        if (calls === 1) {
          firstLoadStarted()
          await firstLoad
        }
        return { mode: "designer-agent", reusedConnection: false, warnings: [] }
      },
    })

    const first = syncToInfobase(input(), fixture.dependencies)
    await started
    const second = syncToInfobase(
      { projectDir: secondProjectDir, allowWrite: true },
      fixture.dependencies,
    )
    let secondSettled = false
    void second.then(() => { secondSettled = true })
    await Promise.resolve()

    expect(secondSettled).toBe(false)
    releaseFirstLoad()
    await expect(first).resolves.toMatchObject({ ok: true, status: "synchronized" })
    await expect(second).resolves.toMatchObject({ ok: true, status: "synchronized" })
  })
})

function input() {
  return { projectDir: "/project", allowWrite: true as const }
}

function expectUnknownDelivery(result: unknown): void {
  expect(result).toMatchObject({
    ok: false,
    code: "delivery_outcome_unknown",
    details: { packageId: "package-1", temporaryDirectory: attemptDirectory },
  })
}

function unchangedResult() {
  return { ok: true as const, status: "unchanged" as const, diagnostics: [] }
}

function preparedResult() {
  return {
    ok: true as const,
    status: "prepared" as const,
    packageId: "package-1",
    archivePath: "/project/.nkdk/tmp/incremental-sync/cf/package-1.zip",
    archiveHash: "1111111111111111",
    entries: ["Catalogs/Test.xml", "load.lst"],
    loadTargets: ["Catalogs/Test.xml"],
    diagnostics: [],
  }
}

function createFixture(options: {
  settings?: Awaited<ReturnType<SyncToInfobaseDependencies["readSettings"]>>
  prepare?: ReturnType<typeof preparedResult> | ReturnType<typeof unchangedResult>
  pendingStatus?: "transferring" | "applied"
  platformError?: Error
  markAppliedError?: Error
  finalizeFailures?: number
  cleanupError?: Error
  recordPhaseError?: Error
  platformLoad?: SyncToInfobaseDependencies["platformManager"]["loadPartialConfiguration"]
} = {}) {
  const events: string[] = []
  let delivery = options.pendingStatus
  let finalizeFailures = options.finalizeFailures ?? 0
  const platformParams: Record<string, unknown> = {}
  const dependencies: SyncToInfobaseDependencies = {
    async readSettings() {
      events.push("readSettings")
      return options.settings ?? readySettings
    },
    resolveComponent({ projectDir, componentPath }) {
      events.push("resolveComponent")
      return {
        ok: true,
        projectDir,
        componentPath: componentPath ?? "cf",
        componentDir: `${projectDir}/${componentPath ?? "cf"}`,
        nkdkDir: `${projectDir}/.nkdk`,
      }
    },
    projectState: { workers: {} } as never,
    core: {
      async readPendingPartialSync() {
        events.push("readPending")
        return delivery === undefined ? undefined : pending(delivery)
      },
      async preparePartialSync() {
        events.push("prepare")
        return options.prepare ?? preparedResult()
      },
      async markPartialSyncTransferring() {
        events.push("markTransferring")
        delivery = "transferring"
      },
      async markPartialSyncPreparedAfterRejection() {
        events.push("markPreparedAfterRejection")
        delivery = undefined
      },
      async markPartialSyncApplied() {
        events.push("markApplied")
        if (options.markAppliedError !== undefined) throw options.markAppliedError
        delivery = "applied"
      },
      async finalizePartialSync() {
        events.push("finalize")
        if (finalizeFailures-- > 0) throw new Error("finalize failed")
        delivery = undefined
        return {
          status: options.pendingStatus === "applied" ? "alreadyPublished" as const : "published" as const,
          configurationIndexPath: "/project/.nkdk/configuration-index/cf.bin",
        }
      },
      async forceClearPendingSync() {
        events.push("forceClear")
        delivery = undefined
      },
    },
    async recordDeliveryPhase({ phase }) {
      events.push(`recordPhase ${phase}`)
      if (options.recordPhaseError !== undefined) throw options.recordPhaseError
    },
    platformManager: {
      async loadPartialConfiguration(params) {
        events.push("platformLoad")
        Object.assign(platformParams, params)
        if (options.platformLoad !== undefined) return options.platformLoad(params)
        if (options.platformError !== undefined) throw options.platformError
        return { mode: "designer-agent", reusedConnection: false, warnings: [] }
      },
    },
    fs: {
      async mkdir(path) {
        events.push(`mkdir ${path}`)
      },
      async rm(path) {
        events.push(`rm ${path}`)
        if (options.cleanupError !== undefined) throw options.cleanupError
      },
    },
    attemptId: () => "attempt-1",
  }
  return { dependencies, events, platformParams }
}

const readySettings = {
  status: "ready" as const,
  projectDir: "/project",
  settingsPath: "/project/.nkdk/project.yaml",
  settings: {
    infobase: {
      connectionString: "File=/base",
      sessionIdleTimeout: 900,
      operations: { import: { mode: "designer-agent" as const, unresolvedReferences: "include" as const } },
    },
  },
}

function pending(status: "transferring" | "applied") {
  return {
    version: 3 as const,
    packageId: "package-1",
    componentPath: "cf",
    archiveProjectPath: ".nkdk/tmp/incremental-sync/cf/package-1.zip",
    archiveHash: "1111111111111111",
    candidateAppliedMigrations: [],
    entries: ["Catalogs/Test.xml", "load.lst"],
    loadTargets: ["Catalogs/Test.xml"],
    delivery: {
      status,
      attemptId: "attempt-1",
      operationLogProjectPath: ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log",
    },
  } as never
}
