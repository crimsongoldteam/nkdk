import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import { createEmptyPersistedSharedValidationSnapshot } from "../validation/persistedSharedValidationSnapshot"
import { createSharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type { ComponentAddress } from "../components/address"
import type {
  ComponentHashState,
  ComponentIndexes,
  ComponentProjectStructure,
} from "../project/componentState"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { FullXmlSyncDiagnostic } from "./types"
import {
  syncComponentToXml,
  type FullXmlSyncCoordinatorDependencies,
} from "./syncConfiguration"
import type { FullXmlSyncExecutionPoolResult } from "./workerPool"

describe("shared full XML sync coordinator", () => {
  const context = {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  } as const

  it("uses the common provider order for cf", async () => {
    const harness = createHarness()

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      concurrency: 2,
    }, harness.deps)

    expect(result.failed).toEqual([])
    expect(result.succeeded).toBe(1)
    expect(harness.events).toEqual([
      "preflight",
      "targetStructure",
      "targetSnapshot",
      "targetHashes",
      "targetIndexes",
      "confirmTarget",
      "buildSelection",
      "execute",
      "transferExternal",
      "validateOutput",
      "writeTargetSnapshot",
      "close",
    ])
    expect(harness.writtenIndex?.binding).toMatchObject({
      componentPath: "cf",
      indexGeneration: 2n,
    })
    expect(harness.writtenIndex?.projectFiles).toEqual([
      { projectPath: "Конфигурация.yaml", contentHash: 10n },
    ])
  })

  it("confirms cf separately before executing one selected cfe", async () => {
    const harness = createHarness()

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cfe/Дополнение",
      xmlDir: "/out",
      concurrency: 1,
    }, harness.deps)

    expect(result.failed).toEqual([])
    expect(harness.events).toEqual([
      "preflight",
      "targetStructure",
      "targetSnapshot",
      "targetHashes",
      "targetIndexes",
      "confirmTarget",
      "baseStructure",
      "baseSnapshot",
      "baseHashes",
      "baseIndexes",
      "confirmBase",
      "buildSelection",
      "execute",
      "transferExternal",
      "validateOutput",
      "writeTargetSnapshot",
      "close",
    ])
    expect(harness.initializedWithBase).toBe(true)
    expect(harness.writtenAddress).toEqual({
      kind: "configurationExtension",
      name: "Дополнение",
    })
  })

  it("keeps the previous snapshot when execution fails", async () => {
    const error: FullXmlSyncDiagnostic = {
      severity: "error",
      code: "broken",
      message: "broken",
    }
    const harness = createHarness({ executionDiagnostics: [error] })

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
    }, harness.deps)

    expect(result.failed).toEqual([error])
    expect(harness.writtenIndex).toBeUndefined()
    expect(harness.events).not.toContain("transferExternal")
  })

  it("treats all and an explicit complete selected list equally", async () => {
    const all = createHarness()
    const selected = createHarness()

    await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out-all",
    }, all.deps)
    await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out-selected",
      selection: { kind: "selected", projectPaths: ["Конфигурация.yaml"] },
    }, selected.deps)

    expect(selected.writtenIndex).toEqual(all.writtenIndex)
  })

  it("rejects an unsupported or partial public selection before worker creation", async () => {
    const unsupported = createHarness()
    const unsupportedResult = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "erf/Отчёт",
      xmlDir: "/out",
    }, unsupported.deps)
    expect(unsupportedResult.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_component_not_supported" }),
    ])

    const partial = createHarness()
    const partialResult = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      selection: { kind: "selected", projectPaths: [] },
    }, partial.deps)
    expect(partialResult.failed).toEqual([
      expect.objectContaining({
        message: "Публичная частичная синхронизация в XML пока не поддерживается",
      }),
    ])
    expect(partial.events).not.toContain("execute")
  })
})

interface HarnessOptions {
  readonly executionDiagnostics?: readonly FullXmlSyncDiagnostic[]
}

function createHarness(options: HarnessOptions = {}) {
  const events: string[] = []
  let writtenIndex: ConfigurationIndexData | undefined
  let writtenAddress: ComponentAddress | undefined
  let initializedWithBase = false
  let targetKind: ComponentAddress["kind"] = "configuration"
  let readingBase = false
  const topology = compileRegisteredMetadataResourceTopology()

  const deps: FullXmlSyncCoordinatorDependencies = {
    async exists(path) {
      if (path === resolve("/project")) events.push("preflight")
      return path === resolve("/project")
    },
    async isDirectoryEmpty() {
      return true
    },
    async mkdir() {},
    async readStructure({ address }) {
      readingBase =
        address.kind === "configuration" &&
        targetKind === "configurationExtension" &&
        events.includes("targetStructure")
      if (!events.includes("targetStructure")) targetKind = address.kind
      events.push(readingBase ? "baseStructure" : "targetStructure")
      return structure(address, topology)
    },
    async readSnapshot({ address }) {
      events.push(readingBase ? "baseSnapshot" : "targetSnapshot")
      return snapshot(address)
    },
    async readHashes({ structure: value }) {
      events.push(readingBase ? "baseHashes" : "targetHashes")
      return hashes(value)
    },
    async readIndexes({ structure: value, hashes: valueHashes }) {
      events.push(readingBase ? "baseIndexes" : "targetIndexes")
      return indexes(value, valueHashes)
    },
    confirmState(params) {
      events.push(readingBase ? "confirmBase" : "confirmTarget")
      return Object.freeze(params)
    },
    resolveProfile(address) {
      if (
        address.kind !== "configuration" &&
        address.kind !== "configurationExtension"
      ) {
        throw new Error(`Unsupported test component: ${address.kind}`)
      }
      return {
        kind: address.kind,
        supports: () => true,
        baseAddress: () =>
          address.kind === "configurationExtension"
            ? { kind: "configuration" }
            : undefined,
        confirm({ target, base }) {
          return {
            kind: address.kind,
            target,
            ...(base === undefined ? {} : { base }),
            workerProfile: {
              kind: address.kind,
              componentKind: address.kind,
              adoptedUuids: {},
              ...(base === undefined
                ? {}
                : {
                    baseForms: {
                      componentDir: base.structure.componentDir,
                      projectFiles: base.hashes.projectFiles,
                      snapshot: base.snapshot,
                    },
                  }),
            },
          }
        },
      }
    },
    buildPlan({ structure: value }) {
      events.push("buildSelection")
      return {
        assignments: [{
          id: "Конфигурация.yaml",
          sourceProjectPath: "Конфигурация.yaml",
          sourcePath: `${value.componentDir}/Конфигурация.yaml`,
          expectedContentHash: 10n,
          role: "configuration",
          itemType: value.address.kind === "configuration"
            ? "MetadataConfiguration"
            : "MetadataConfigurationExtension",
          itemName: "Конфигурация",
          logicalAddress: "Конфигурация",
          ...fullXmlSyncTestTopologyFields("Конфигурация.yaml"),
        }],
        externalFiles: [],
      }
    },
    createWorkerPool() {
      return {
        async initialize(params) {
          initializedWithBase = params.baseMetadata !== undefined
        },
        async execute(): Promise<FullXmlSyncExecutionPoolResult> {
          events.push("execute")
          return {
            diagnostics: [...options.executionDiagnostics ?? []],
            warnings: [],
            writtenFiles: [{
              assignmentId: "Конфигурация.yaml",
              targetXmlPath: "Configuration.xml",
            }],
            expectedOutputs: [{
              assignmentId: "Конфигурация.yaml",
              targetXmlPath: "Configuration.xml",
            }],
            fragmentData: {
              identities: [],
              xmlNodes: [],
              xmlValues: [],
            },
          }
        },
        async close() {
          events.push("close")
        },
      }
    },
    async transferExternalFiles() {
      events.push("transferExternal")
      return { copiedFiles: [], projectFiles: [] }
    },
    validateWrittenFiles() {
      events.push("validateOutput")
      return []
    },
    async writeIndex(params) {
      events.push("writeTargetSnapshot")
      writtenIndex = params.data
      writtenAddress = params.address
    },
  }

  return {
    events,
    deps,
    get writtenIndex() {
      return writtenIndex
    },
    get writtenAddress() {
      return writtenAddress
    },
    get initializedWithBase() {
      return initializedWithBase
    },
  }
}

function structure(
  address: ComponentAddress,
  topology: ReturnType<typeof compileRegisteredMetadataResourceTopology>
): ComponentProjectStructure {
  const componentPath =
    address.kind === "configuration" ? "cf" : `cfe/${address.name}`
  return {
    address,
    componentPath,
    componentDir: `/project/${componentPath}`,
    topology,
    resources: [],
    projectPaths: ["Конфигурация.yaml"],
  }
}

function hashes(structure: ComponentProjectStructure): ComponentHashState {
  return {
    componentPath: structure.componentPath,
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
  }
}

function indexes(
  structure: ComponentProjectStructure,
  hashState: ComponentHashState
): ComponentIndexes {
  return {
    componentPath: structure.componentPath,
    sourceProjectFiles: hashState.projectFiles,
    metadata: createSharedValidationSnapshot({ records: [], filePaths: [] }),
    dependencies: [],
    logicalAddresses: [{
      logicalAddress: "Конфигурация",
      sourceProjectPath: "Конфигурация.yaml",
    }],
  }
}

function snapshot(address: ComponentAddress) {
  const componentPath =
    address.kind === "configuration" ? "cf" : `cfe/${address.name}`
  return snapshotConfigurationIndex(encodeConfigurationIndex({
    binding: {
      indexGeneration: 1n,
      producerVersion: "test",
      componentPath,
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
    identities: [],
    xmlNodes: [],
    xmlValues: [],
    localIndexes: {
      metadata: createEmptyPersistedSharedValidationSnapshot(),
      dependencies: [],
      logicalAddresses: [],
    },
  }))
}
