import {
  readXmlSyncState,
  syncConfigurationIncrementallyToXML,
  syncConfigurationToXML,
  type ConfigurationSyncResult,
  type XmlSyncState,
} from "@nakidka/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { syncConfiguration } from "./sync"

const mocks = vi.hoisted(() => ({
  readXmlSyncState: vi.fn(async (): Promise<XmlSyncState | undefined> => undefined),
  syncConfigurationIncrementallyToXML: vi.fn(
    async (): Promise<ConfigurationSyncResult> => ({ succeeded: 0, changedXmlFiles: [], failed: [] }),
  ),
  syncConfigurationToXML: vi.fn(async (): Promise<ConfigurationSyncResult> => ({ succeeded: 0, failed: [] })),
}))

vi.mock("@nakidka/core", () => ({
  readXmlSyncState: mocks.readXmlSyncState,
  syncConfigurationIncrementallyToXML: mocks.syncConfigurationIncrementallyToXML,
  syncConfigurationToXML: mocks.syncConfigurationToXML,
}))

describe("sync command", () => {
  const originalExitCode = process.exitCode

  beforeEach(() => {
    mocks.readXmlSyncState.mockClear()
    mocks.readXmlSyncState.mockResolvedValue(undefined)
    mocks.syncConfigurationIncrementallyToXML.mockClear()
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

  it("использует полный sync, если файла состояния нет", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await syncConfiguration("yaml", "xml")

    expect(readXmlSyncState).toHaveBeenCalledWith("xml")
    expect(syncConfigurationToXML).toHaveBeenCalledOnce()
    expect(syncConfigurationIncrementallyToXML).not.toHaveBeenCalled()
  })

  it("использует инкрементальный sync, если файл состояния есть", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    mocks.readXmlSyncState.mockResolvedValue({ version: 1, files: {} })

    await syncConfiguration("yaml", "xml")

    expect(syncConfigurationIncrementallyToXML).toHaveBeenCalledWith(expect.objectContaining({
      inputDir: "yaml",
      outputDir: "xml",
    }))
    expect(syncConfigurationToXML).not.toHaveBeenCalled()
  })

  it("печатает изменённые XML-файлы при инкрементальном sync", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    mocks.readXmlSyncState.mockResolvedValue({ version: 1, files: {} })
    mocks.syncConfigurationIncrementallyToXML.mockResolvedValueOnce({
      succeeded: 1,
      changedXmlFiles: ["Catalogs/Товары/Forms/ФормаЭлемента.xml"],
      failed: [],
    })

    await syncConfiguration("yaml", "xml")

    expect(stdout).toHaveBeenCalledWith("Изменённые XML-файлы:\n")
    expect(stdout).toHaveBeenCalledWith("  Catalogs/Товары/Forms/ФормаЭлемента.xml\n")
  })
})
