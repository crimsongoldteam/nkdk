import { syncConfigurationToXML } from "@nakidka/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { syncConfiguration } from "./sync"

const mocks = vi.hoisted(() => ({
  syncConfigurationToXML: vi.fn(async () => ({ succeeded: 0, failed: [] })),
}))

vi.mock("@nakidka/core", () => ({
  syncConfigurationToXML: mocks.syncConfigurationToXML,
}))

describe("sync command", () => {
  const originalExitCode = process.exitCode

  beforeEach(() => {
    mocks.syncConfigurationToXML.mockClear()
  })

  afterEach(() => {
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
  })

  it("передает явный referenceDir в syncConfigurationToXML", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await syncConfiguration("yaml", "xml", { referenceDir: "reference-xml" })

    expect(syncConfigurationToXML).toHaveBeenCalledWith(expect.objectContaining({
      inputDir: "yaml",
      outputDir: "xml",
      referenceDir: "reference-xml",
    }))
  })

})
