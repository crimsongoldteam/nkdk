import { beforeEach, describe, expect, it, vi } from "vitest"

const fixture = vi.hoisted(() => {
  const partial = {
    prepare: vi.fn(async (params: unknown) => ({ ok: true, status: "unchanged", diagnostics: [], params })),
    readPending: vi.fn(async () => undefined),
    markTransferring: vi.fn(async () => undefined),
    markPreparedAfterRejection: vi.fn(async () => undefined),
    markApplied: vi.fn(async () => undefined),
    finalize: vi.fn(async () => ({ status: "published", configurationIndexPath: "/project/index.bin" })),
  }
  return {
    partial,
    runtime: {
      projects: { parsePath() {}, createState() {}, describeStructure() {} },
      schemas: {
        ProjectFileSchemaError: Error,
        splitSearchTerms() {},
        listSummaryKeys() {},
        summarize() {},
        exportForProjectFile() {},
        exportByName() {},
      },
      validation: { validateProject() {} },
      metadata: { rename() {}, findReferences() {} },
      import: { configurationFromXml() {} },
      sync: {
        planToXml() {},
        configurationToXml() {},
        readState() {},
        initializeState() {},
        partial,
      },
      async close() {},
    },
  }
})

vi.mock("./metadataRuntimeHandle", () => ({
  metadataRuntimeHandle: { get: vi.fn(async () => fixture.runtime) },
}))

import { loadCoreApi } from "./coreApi"

describe("CoreApi частичной синхронизации", () => {
  beforeEach(() => vi.clearAllMocks())

  it("проводит операции через публичную границу MetadataRuntime", async () => {
    const core = await loadCoreApi()
    const projectState = { workers: {} } as never
    const prepareParams = {
      context: { defaultLanguage: "ru" as const, version: "2.20" as const },
      projectDir: "/project",
      componentPath: "cf",
      projectState,
    }

    await core.preparePartialSync(prepareParams)
    await core.readPendingPartialSync("/project", "cf")
    await core.markPartialSyncTransferring({
      projectDir: "/project",
      componentPath: "cf",
      packageId: "package-1",
      attemptId: "attempt-1",
      operationLogProjectPath: ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log",
    })
    await core.markPartialSyncPreparedAfterRejection({
      projectDir: "/project", componentPath: "cf", packageId: "package-1", attemptId: "attempt-1",
    })
    await core.markPartialSyncApplied({
      projectDir: "/project", componentPath: "cf", packageId: "package-1", attemptId: "attempt-1",
    })
    await core.finalizePartialSync({ projectDir: "/project", componentPath: "cf", packageId: "package-1" })

    expect(fixture.partial.prepare).toHaveBeenCalledWith(prepareParams)
    expect(fixture.partial.readPending).toHaveBeenCalledWith("/project", "cf")
    expect(fixture.partial.markTransferring).toHaveBeenCalledOnce()
    expect(fixture.partial.markPreparedAfterRejection).toHaveBeenCalledOnce()
    expect(fixture.partial.markApplied).toHaveBeenCalledOnce()
    expect(fixture.partial.finalize).toHaveBeenCalledOnce()
  })

  it("отклоняет ProjectStateService вне MetadataRuntime до подготовки", async () => {
    const core = await loadCoreApi()

    expect(() => core.preparePartialSync({
      context: { defaultLanguage: "ru", version: "2.20" },
      projectDir: "/project",
      componentPath: "cf",
      projectState: {} as never,
    })).toThrow("вне MetadataRuntime")
    expect(fixture.partial.prepare).not.toHaveBeenCalled()
  })
})
