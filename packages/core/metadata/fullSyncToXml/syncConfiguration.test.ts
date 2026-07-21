import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { configurationIndexPath } from "../configurationIndex/fileIO"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../configurationIndex/testData"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import { NKDK_CORE_VERSION } from "../../version"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExternalFile,
  FullXmlSyncOwnerFacts,
} from "./types"
import { syncConfigurationToXml, type FullXmlSyncCoordinatorDependencies } from "./syncConfiguration"
import type {
  FullXmlSyncFirstPassPoolResult,
  FullXmlSyncSecondPassPoolResult,
  FullXmlSyncWorkerPool,
} from "./workerPool"

describe("syncConfigurationToXml", () => {
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } } as const

  it("runs the full operation in order and writes the new configuration index last", async () => {
    const harness = createHarness()
    const result = await syncConfigurationToXml(
      { context, yamlDir: "/project", xmlDir: "/out", concurrency: 2 },
      harness.deps
    )

    expect(result).toEqual({
      succeeded: 3,
      failed: [],
      warnings: [{ severity: "warning", code: "soft", message: "warning" }],
      configurationIndexPath: configurationIndexPath("/project", "default"),
    })
    expect(harness.events).toEqual([
      "exists:/project",
      "exists:/out",
      "mkdir:/out",
      "readIndex",
      "discover",
      "createPool:2",
      "pool.initialize",
      "pool.firstPass",
      "sharedMetadata",
      "pool.secondPass",
      "transferExternalFiles",
      "writeConfigDumpInfo",
      "writeIndex",
      "pool.close",
    ])
    expect(harness.writtenIndex?.binding).toMatchObject({
      baseId: "default",
      producerVersion: NKDK_CORE_VERSION,
      indexGeneration: 2n,
    })
    expect([...harness.writtenIndex?.binding.baseFingerprint ?? []]).toEqual([1, 2])
    expect([...harness.writtenIndex?.binding.configurationVersion ?? []]).toEqual([3, 4])
    expect(harness.writtenIndex?.projectFiles).toEqual([
      { projectPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl", contentHash: 30n },
      { projectPath: "Справочник/Товары/Свойства.yaml", contentHash: 10n },
    ])
    expect(harness.writtenIndex?.identities).toEqual([
      { logicalAddress: "Справочник.Товары", kind: "uuid", value: "00000000-0000-4000-8000-000000000002" },
      { logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары", kind: "xmlId", value: "dump" },
    ])
  })

  it("does not create workers or write files when the target directory is not empty", async () => {
    const harness = createHarness({ xmlExists: true, xmlEmpty: false })
    const result = await syncConfigurationToXml({ context, yamlDir: "/project", xmlDir: "/out" }, harness.deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_target_not_empty", severity: "error" }),
    ])
    expect(harness.events).toEqual(["exists:/project", "exists:/out", "isDirectoryEmpty:/out"])
    expect(harness.writtenIndex).toBeUndefined()
  })

  it("stops after first-pass errors and keeps the previous index", async () => {
    const error: FullXmlSyncDiagnostic = { severity: "error", code: "yaml", message: "bad yaml" }
    const harness = createHarness({ firstPassDiagnostics: [error] })
    const result = await syncConfigurationToXml({ context, yamlDir: "/project", xmlDir: "/out" }, harness.deps)

    expect(result.failed).toEqual([error])
    expect(harness.events).toEqual([
      "exists:/project",
      "exists:/out",
      "mkdir:/out",
      "readIndex",
      "discover",
      "createPool:4",
      "pool.initialize",
      "pool.firstPass",
      "pool.close",
    ])
    expect(harness.writtenIndex).toBeUndefined()
  })

  it("stops after second-pass errors before transferring files and writing the index", async () => {
    const error: FullXmlSyncDiagnostic = { severity: "error", code: "xml", message: "bad xml" }
    const harness = createHarness({ secondPassDiagnostics: [error] })
    const result = await syncConfigurationToXml({ context, yamlDir: "/project", xmlDir: "/out" }, harness.deps)

    expect(result.failed).toEqual([error])
    expect(harness.events).toEqual([
      "exists:/project",
      "exists:/out",
      "mkdir:/out",
      "readIndex",
      "discover",
      "createPool:4",
      "pool.initialize",
      "pool.firstPass",
      "sharedMetadata",
      "pool.secondPass",
      "pool.close",
    ])
    expect(harness.writtenIndex).toBeUndefined()
  })

  it("keeps the previous index when external transfer or ConfigDumpInfo fails", async () => {
    const transfer = createHarness({ transferError: new Error("copy failed") })
    await syncConfigurationToXml({ context, yamlDir: "/project", xmlDir: "/out" }, transfer.deps)
    expect(transfer.events.at(-2)).toBe("transferExternalFiles")
    expect(transfer.writtenIndex).toBeUndefined()

    const configDumpInfo = createHarness({ configDumpInfoError: new Error("dump failed") })
    await syncConfigurationToXml({ context, yamlDir: "/project", xmlDir: "/out" }, configDumpInfo.deps)
    expect(configDumpInfo.events.at(-2)).toBe("writeConfigDumpInfo")
    expect(configDumpInfo.writtenIndex).toBeUndefined()
  })
})

interface HarnessOptions {
  readonly xmlExists?: boolean
  readonly xmlEmpty?: boolean
  readonly firstPassDiagnostics?: readonly FullXmlSyncDiagnostic[]
  readonly secondPassDiagnostics?: readonly FullXmlSyncDiagnostic[]
  readonly transferError?: Error
  readonly configDumpInfoError?: Error
}

function createHarness(options: HarnessOptions = {}) {
  const events: string[] = []
  let writtenIndex: ConfigurationIndexData | undefined
  const index = {
    ...sampleIndex(),
    binding: {
      ...sampleIndex().binding,
      indexGeneration: 1n,
      baseFingerprint: Uint8Array.of(1, 2),
      configurationVersion: Uint8Array.of(3, 4),
    },
    projectFiles: [
      { projectPath: "removed.yaml", contentHash: 1n },
      { projectPath: "Справочник/Товары/Свойства.yaml", contentHash: 1n },
    ],
  }
  const assignments: FullXmlSyncAssignment[] = [
    {
      id: "catalog",
      sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      sourcePath: "/project/Справочник/Товары/Свойства.yaml",
      role: "properties",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      outputs: [{ routeKind: "owner", targetXmlPath: "Catalogs/Товары.xml" }],
    },
  ]
  const externalFiles: FullXmlSyncExternalFile[] = [
    {
      sourceProjectPath: "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      sourcePath: "/project/Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      targetXmlPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
    },
  ]

  const deps: FullXmlSyncCoordinatorDependencies = {
    async exists(path) {
      events.push(`exists:${path}`)
      if (path === resolve("/project")) return true
      if (path === resolve("/out")) return options.xmlExists ?? false
      return false
    },
    async isDirectoryEmpty(path) {
      events.push(`isDirectoryEmpty:${path}`)
      return options.xmlEmpty ?? true
    },
    async mkdir(path) {
      events.push(`mkdir:${path}`)
    },
    async discover() {
      events.push("discover")
      return { assignments, externalFiles }
    },
    async readIndexSnapshot() {
      events.push("readIndex")
      return snapshotConfigurationIndex(encodeConfigurationIndex(index))
    },
    createWorkerPool({ concurrency }) {
      events.push(`createPool:${concurrency}`)
      return fakePool(events, options)
    },
    createSharedMetadata(params) {
      events.push("sharedMetadata")
      return {
        assignmentCount: params.assignments.length,
        ownerCount: params.owners.length,
      } as never
    },
    async transferExternalFiles() {
      events.push("transferExternalFiles")
      if (options.transferError !== undefined) throw options.transferError
      return {
        copiedFiles: [{ sourceProjectPath: externalFiles[0]!.sourceProjectPath, targetXmlPath: externalFiles[0]!.targetXmlPath }],
        projectFiles: [{ projectPath: externalFiles[0]!.targetXmlPath, contentHash: 30n }],
      }
    },
    async writeConfigDumpInfo() {
      events.push("writeConfigDumpInfo")
      if (options.configDumpInfoError !== undefined) throw options.configDumpInfoError
      return {
        targetXmlPath: "ConfigDumpInfo.xml",
        fragment: {
          targetProjectPath: "Конфигурация.yaml",
          identities: [{ logicalAddress: "Конфигурация.ConfigDumpInfo.Catalog%2EТовары", kind: "xmlId", value: "dump" }],
          xmlNodes: [],
          xmlValues: [],
        },
      }
    },
    async writeIndex(params) {
      events.push("writeIndex")
      writtenIndex = params.data
    },
  }

  return {
    events,
    deps,
    get writtenIndex() {
      return writtenIndex
    },
  }
}

function fakePool(events: string[], options: HarnessOptions): FullXmlSyncWorkerPool {
  return {
    async initialize() {
      events.push("pool.initialize")
    },
    async runFirstPass(): Promise<FullXmlSyncFirstPassPoolResult> {
      events.push("pool.firstPass")
      const ownerFacts: FullXmlSyncOwnerFacts[] = [
        {
          assignmentId: "catalog",
          sourceProjectPath: "Справочник/Товары/Свойства.yaml",
          sourcePath: "/project/Справочник/Товары/Свойства.yaml",
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "MetadataCatalog",
        },
      ]
      return {
        diagnostics: [...options.firstPassDiagnostics ?? []],
        projectFiles: [{ projectPath: "Справочник/Товары/Свойства.yaml", contentHash: 10n }],
        ownerFacts,
      }
    },
    async runSecondPass(): Promise<FullXmlSyncSecondPassPoolResult> {
      events.push("pool.secondPass")
      return {
        diagnostics: [...options.secondPassDiagnostics ?? []],
        warnings: [{ severity: "warning", code: "soft", message: "warning" }],
        writtenFiles: [{ assignmentId: "catalog", targetXmlPath: "Catalogs/Товары.xml" }],
        fragmentData: {
          identities: [
            { logicalAddress: "Справочник.Товары", kind: "uuid", value: "00000000-0000-4000-8000-000000000002" },
          ],
          xmlNodes: [],
          xmlValues: [],
        },
      }
    },
    async close() {
      events.push("pool.close")
    },
  }
}
