import { describe, expect, it, vi } from "vitest"
import { createBackgroundOperationRegistry, type BackgroundOperationServices } from "./backgroundOperationRegistry"

const failure = { ok: false as const, code: "core_error" as const, message: "failure" }

describe("background operation registry", () => {
  it("maps every operation kind to its service and operation signal", async () => {
    const services: BackgroundOperationServices = {
      importFromInfobase: vi.fn(async () => failure),
      importFromXml: vi.fn(async () => failure),
      syncToInfobase: vi.fn(async () => failure),
      syncToXml: vi.fn(async () => failure),
      rebuildProjectCache: vi.fn(async () => failure),
      validateProject: vi.fn(async () => failure),
    }
    const registry = createBackgroundOperationRegistry(services)
    const signal = new AbortController().signal
    const context = { signal, report: vi.fn(async () => undefined) }

    await registry.import_from_infobase.run({ projectDir: "C:/project", allowWrite: true }, context)
    await registry.import_from_xml.run({ projectDir: "C:/project", xmlDir: "C:/xml", allowWrite: true }, context)
    await registry.sync_to_infobase.run({ projectDir: "C:/project", allowWrite: true }, context)
    await registry.sync_to_xml.run({ projectDir: "C:/project", xmlDir: "C:/xml", allowWrite: true }, context)
    await registry.rebuild_project_cache.run({ projectDir: "C:/project", allowWrite: true }, context)
    await registry.validate_project.run({ projectDir: "C:/project" }, context)

    expect(services.importFromInfobase).toHaveBeenCalledWith(
      { projectDir: "C:/project", allowWrite: true }, undefined, signal,
    )
    expect(services.importFromXml).toHaveBeenCalledWith(
      { projectDir: "C:/project", xmlDir: "C:/xml", allowWrite: true }, undefined, signal,
    )
    expect(services.syncToInfobase).toHaveBeenCalledWith(
      { projectDir: "C:/project", allowWrite: true }, undefined, signal,
    )
    expect(services.syncToXml).toHaveBeenCalledWith(
      { projectDir: "C:/project", xmlDir: "C:/xml", allowWrite: true }, undefined, signal,
    )
    expect(services.rebuildProjectCache).toHaveBeenCalledWith(
      { projectDir: "C:/project", allowWrite: true }, undefined, signal,
    )
    expect(services.validateProject).toHaveBeenCalledWith(
      { projectDir: "C:/project" }, undefined, signal,
    )
  })
})
