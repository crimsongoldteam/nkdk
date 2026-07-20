import { syncConfigurationToXML, type FullXmlSyncResult } from "@nkdk/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { syncConfiguration } from "./sync"

const mocks = vi.hoisted(() => ({
  syncConfigurationToXML: vi.fn(
    async (): Promise<FullXmlSyncResult> => ({ succeeded: 0, failed: [], warnings: [] }),
  ),
}))

vi.mock("@nkdk/core", () => ({
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

  it("always uses full XML sync through the configuration index", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await syncConfiguration("yaml", "xml", { concurrency: 4 })

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        yamlDir: "yaml",
        xmlDir: "xml",
        concurrency: 4,
      }),
    )
  })

  it("prints warnings and configuration index path", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    mocks.syncConfigurationToXML.mockResolvedValueOnce({
      succeeded: 2,
      failed: [],
      warnings: [{ severity: "warning", code: "data_path", message: "ПутьКДанным не преобразован" }],
      configurationIndexPath: "/project/.nkdk/configuration-index/default.bin",
    })

    await syncConfiguration("yaml", "xml")

    expect(stderr).toHaveBeenCalledWith("⚠ data_path: ПутьКДанным не преобразован\n")
    expect(stdout).toHaveBeenCalledWith("Готово: 2 успешно, 0 с ошибкой\n")
    expect(stdout).toHaveBeenCalledWith("Индекс конфигурации: /project/.nkdk/configuration-index/default.bin\n")
  })

  it("prints diagnostics and exits non-zero on errors", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    mocks.syncConfigurationToXML.mockResolvedValueOnce({
      succeeded: 0,
      failed: [{ severity: "error", code: "full_xml_sync_target_not_empty", message: "XML-каталог не пуст" }],
      warnings: [],
    })

    await syncConfiguration("yaml", "xml")

    expect(stderr).toHaveBeenCalledWith("✖ full_xml_sync_target_not_empty: XML-каталог не пуст\n")
    expect(process.exitCode).toBe(1)
  })
})
