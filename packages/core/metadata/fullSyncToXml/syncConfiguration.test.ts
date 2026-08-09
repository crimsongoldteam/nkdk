import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import type {
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  MergedConfigurationSnapshotFragments,
} from "../configurationIndex/types"
import { entity } from "../configurationIndex/testData"
import type { ComponentAddress } from "../components/address"
import type {
  ComponentHashState,
  ComponentProjectStructure,
} from "../project/componentState"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { FullXmlSyncDiagnostic } from "./types"
import {
  planSyncConfigurationToXml,
  replaceSnapshotEntities,
  syncComponentToXml,
  type FullXmlSyncCoordinatorDependencies,
} from "./syncConfiguration"
import { createMockFullSyncDependencies, emptyProjectStateReadSession } from "./testHelpers"
import {
  createFullXmlSyncDiagnosticCollectionFromDiagnostics,
  createFullXmlSyncFileCollectionFromFiles,
  type FullXmlSyncExecutionPoolResult,
} from "./workerPool"
import { createUnusedMetadataWorkerPool } from "../../tests/metadataWorkerTestPool"

describe("shared full XML sync coordinator", () => {
  const context = {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  } as const
  const runHarnessSync = (harness: ReturnType<typeof createHarness>, options: {
    readonly ignoreValidationErrors: boolean
    readonly selected: boolean
  }) => syncComponentToXml({
    context,
    projectDir: "/project",
    componentPath: "cf",
    xmlDir: "/out",
    projectState: harness.projectState,
    ignoreValidationErrors: options.ignoreValidationErrors,
    ...(options.selected ? { selection: { kind: "selected" as const, projectPaths: ["Конфигурация.yaml"] } } : {}),
  }, harness.deps)

  it("uses the common provider order for cf", async () => {
    const harness = createHarness()

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      concurrency: 2,
      projectState: harness.projectState,
    }, harness.deps)

    expect(result.failed).toEqual([])
    expect(result.succeeded).toBe(1)
    expect(harness.events).toEqual([
      "refresh",
      "preflight",
      "targetStructure",
      "targetSnapshot",
      "targetHashes",
      "confirmTarget",
      "buildSelection",
      "execute",
      "transferExternal",
      "validateOutput",
      "writeTargetSnapshot",
      "close",
    ])
    expect(harness.writtenIndex).toMatchObject({
      specificationVersion: "1.3",
      componentPath: "cf",
      indexGeneration: 2n,
    })
    expect(harness.writtenIndex?.files).toEqual([
      { projectPath: "Конфигурация.yaml", contentHash: 10n },
    ])
    expect(harness.writtenIndex?.entities).toEqual([])
  })

  it.each([
    ["full", false, "blocked"],
    ["selected", false, "blocked"],
    ["full", true, "executed"],
    ["selected", true, "executed"],
  ] as const)("%s sync blocks validation errors only without ignoreValidationErrors=%s", async (mode, ignoreValidationErrors, outcome) => {
    const validationError = {
      filePath: "/project/cf/Конфигурация.yaml",
      line: 2,
      col: 3,
      severity: "error" as const,
      source: "structure" as const,
      message: "Некорректный YAML",
    }
    const harness = createHarness({ refreshDiagnostics: [validationError] })

    const result = await runHarnessSync(harness, { ignoreValidationErrors, selected: mode === "selected" })

    expect(harness.events).toEqual(outcome === "blocked"
      ? ["refresh"]
      : [
          "refresh", "preflight", "targetStructure", "targetSnapshot", "targetHashes", "confirmTarget",
          "buildSelection", "execute", "transferExternal", "validateOutput", "writeTargetSnapshot", "close",
        ])
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "project_validation", source: "structure", sourcePath: validationError.filePath }),
    ])
    expect(result.failed).toHaveLength(outcome === "blocked" ? 1 : 0)
  })

  it.each([
    ["full", false],
    ["selected", true],
  ] as const)("%s sync blocks a technical refresh failure with ignoreValidationErrors=%s", async (mode, ignoreValidationErrors) => {
    const harness = createHarness({ refreshFailure: new Error("writer недоступен") })

    const result = await runHarnessSync(harness, { ignoreValidationErrors, selected: mode === "selected" })

    expect(harness.events).toEqual(["refresh"])
    expect(result.failed).toEqual([expect.objectContaining({ message: "writer недоступен" })])
  })

  it("refreshes the whole project before building a preview plan", async () => {
    const harness = createHarness()

    const result = await planSyncConfigurationToXml({
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, harness.deps)

    expect(result).toMatchObject({ ok: true, diagnostics: [] })
    expect(harness.events.slice(0, 6)).toEqual([
      "refresh", "preflight", "targetStructure", "targetSnapshot", "targetHashes", "confirmTarget",
    ])
    expect(harness.events).not.toContain("targetIndexes")
  })

  it("returns refresh warnings together with sync diagnostics", async () => {
    const warning = {
      filePath: "/project/cf/Конфигурация.yaml",
      line: 1,
      col: 2,
      severity: "warning" as const,
      source: "reference" as const,
      message: "Предупреждение",
    }
    const harness = createHarness({ refreshDiagnostics: [warning] })

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, harness.deps)

    expect(result.warnings).toEqual([expect.objectContaining({ code: "project_validation", source: "reference" })])
    expect(result.diagnostics).toEqual(result.warnings)
  })

  it("returns refresh and sync diagnostics when worker cleanup fails", async () => {
    const warning = {
      filePath: "/project/cf/Конфигурация.yaml",
      line: 1,
      col: 2,
      severity: "warning" as const,
      source: "reference" as const,
      message: "Предупреждение",
    }
    const executionFailure: FullXmlSyncDiagnostic = {
      severity: "error",
      code: "assignment_failed",
      message: "Ошибка assignment",
    }
    const harness = createHarness({
      refreshDiagnostics: [warning],
      executionDiagnostics: [executionFailure],
      closeFailure: new Error("Ошибка dispose"),
    })

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, harness.deps)

    expect(result.failed).toEqual([
      executionFailure,
      expect.objectContaining({ code: "full_xml_sync_operation_failed", message: "Ошибка dispose" }),
    ])
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "project_validation", severity: "warning" }),
      executionFailure,
      expect.objectContaining({ code: "full_xml_sync_operation_failed", message: "Ошибка dispose" }),
    ])
  })

  it.each([false, true])("preview plan blocks validation errors only without ignoreValidationErrors=%s", async (ignoreValidationErrors) => {
    const validationError = {
      filePath: "/project/cf/Конфигурация.yaml",
      line: 1,
      col: 1,
      severity: "error" as const,
      source: "syntax" as const,
      message: "Ошибка YAML",
    }
    const harness = createHarness({ refreshDiagnostics: [validationError] })

    const result = await planSyncConfigurationToXml({
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
      ignoreValidationErrors,
    }, harness.deps)

    expect(result.ok).toBe(ignoreValidationErrors)
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "project_validation", source: "syntax" }),
    ])
    expect(harness.events[0]).toBe("refresh")
    expect(harness.events.includes("buildSelection")).toBe(ignoreValidationErrors)
  })

  it("preview plan keeps refresh diagnostics when a later technical error occurs", async () => {
    const warning = {
      filePath: "/project/cf/Конфигурация.yaml",
      line: 1,
      col: 1,
      severity: "warning" as const,
      source: "reference" as const,
      message: "Предупреждение",
    }
    const harness = createHarness({ refreshDiagnostics: [warning] })

    const result = await planSyncConfigurationToXml({
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, {
      ...harness.deps,
      async readStructure() {
        throw new Error("структура недоступна")
      },
    })

    expect(result).toMatchObject({ ok: false })
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: "project_validation", severity: "warning" }),
      expect.objectContaining({ code: "full_xml_sync_operation_failed", severity: "error" }),
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
      projectState: harness.projectState,
    }, harness.deps)

    expect(result.failed).toEqual([])
    expect(harness.events).toEqual([
      "refresh",
      "preflight",
      "targetStructure",
      "targetSnapshot",
      "targetHashes",
      "confirmTarget",
      "baseStructure",
      "baseSnapshot",
      "baseHashes",
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
      projectState: harness.projectState,
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
      projectState: all.projectState,
    }, all.deps)
    await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out-selected",
      projectState: selected.projectState,
      selection: { kind: "selected", projectPaths: ["Конфигурация.yaml"] },
    }, selected.deps)

    expect(selected.writtenIndex).toEqual(all.writtenIndex)
  })

  it("rejects an unsupported component before XML and snapshot writes", async () => {
    const unsupported = createHarness()
    const unsupportedResult = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "erf/Отчёт",
      xmlDir: "/out",
      projectState: unsupported.projectState,
    }, unsupported.deps)
    expect(unsupportedResult.failed).toEqual([
      expect.objectContaining({ code: "full_xml_sync_component_not_supported" }),
    ])
  })

  it.each(["sync", "preview"] as const)(
    "rejects an incomplete %s selection from the refreshed projection before side effects",
    async (mode) => {
      const warning = incompleteSelectionWarning()
      const harness = createHarness({ refreshDiagnostics: [warning] })
      const common = {
        projectDir: "/project",
        componentPath: "cf",
        xmlDir: "/out",
        projectState: harness.projectState,
        selection: { kind: "selected" as const, projectPaths: [] },
      }
      const result = mode === "sync"
        ? await syncComponentToXml({ ...common, context }, harness.deps)
        : await planSyncConfigurationToXml(common, harness.deps)

      expect(result).toEqual(expect.objectContaining({
        failed: [expect.objectContaining({
          message: "Публичная частичная синхронизация в XML пока не поддерживается",
        })],
      }))
      expect(result.diagnostics).toEqual([
        expect.objectContaining({ code: "project_validation", severity: "warning" }),
        expect.objectContaining({ message: "Публичная частичная синхронизация в XML пока не поддерживается" }),
      ])
      expect(harness.events).toEqual(["refresh"])
      expect(harness.projectionReads).toEqual(["cf"])
      expect(harness.ensureXmlDirectoryCalls).toBe(0)
      expect(harness.confirmStateCalls).toBe(0)
      expect(harness.profileConfirmCalls).toBe(0)
      expect(harness.workerPoolCreations).toBe(0)
      expect(harness.writtenIndex).toBeUndefined()
    },
  )

  it("не публикует снимок при конфликте logicalAddress с неизменённым файлом", async () => {
    const harness = createHarness({
      previousFiles: [
        { projectPath: "Конфигурация.yaml", contentHash: 10n },
        { projectPath: "Неизменённый.yaml", contentHash: 20n },
      ],
      previousEntities: [entity("Конфликт", "Неизменённый.yaml")],
      fragmentData: {
        sourceProjectPaths: ["Конфигурация.yaml"],
        entities: [entity("Конфликт", "Конфигурация.yaml")],
      },
    })

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, harness.deps)

    expect(result.failed).toEqual([
      expect.objectContaining({ message: expect.stringContaining("Повторный logicalAddress") }),
    ])
    expect(harness.writtenIndex).toBeUndefined()
    expect(harness.events).not.toContain("writeTargetSnapshot")
  })
})

describe("replaceSnapshotEntities", () => {
  it("целиком заменяет entity изменённого файла и сохраняет неизменённый", () => {
    expect(replaceSnapshotEntities({
      previous: [
        entity("Старый", "А.yaml"),
        entity("Остаётся", "Б.yaml"),
      ],
      replacements: {
        sourceProjectPaths: ["А.yaml"],
        entities: [entity("Новый", "А.yaml")],
      },
    })).toEqual([
      entity("Новый", "А.yaml"),
      entity("Остаётся", "Б.yaml"),
    ])
  })

  it("удаляет все entity файла при пустом фрагменте", () => {
    expect(replaceSnapshotEntities({
      previous: [entity("Старый", "А.yaml")],
      replacements: { sourceProjectPaths: ["А.yaml"], entities: [] },
    })).toEqual([])
  })

  it("отклоняет глобальный конфликт logicalAddress", () => {
    expect(() => replaceSnapshotEntities({
      previous: [entity("Объект", "Б.yaml")],
      replacements: {
        sourceProjectPaths: ["А.yaml"],
        entities: [entity("Объект", "А.yaml")],
      },
    })).toThrow("Повторный logicalAddress")
  })
})

interface HarnessOptions {
  readonly executionDiagnostics?: readonly FullXmlSyncDiagnostic[]
  readonly fragmentData?: MergedConfigurationSnapshotFragments
  readonly previousFiles?: ConfigurationSnapshot["files"]
  readonly previousEntities?: readonly ConfigurationSnapshotEntity[]
  readonly refreshDiagnostics?: readonly {
    readonly filePath: string
    readonly line: number
    readonly col: number
    readonly severity: "error" | "warning"
    readonly source: "syntax" | "structure" | "external-file" | "cross-file" | "reference"
    readonly message: string
  }[]
  readonly refreshFailure?: Error
  readonly closeFailure?: Error
}

function incompleteSelectionWarning() {
  return {
    filePath: "/project/cf/Конфигурация.yaml",
    line: 1,
    col: 2,
    severity: "warning" as const,
    source: "reference" as const,
    message: "Предупреждение",
  }
}

function createHarness(options: HarnessOptions = {}) {
  const events: string[] = []
  const projectionReads: string[] = []
  let writtenIndex: ConfigurationSnapshot | undefined
  let writtenAddress: ComponentAddress | undefined
  let initializedWithBase = false
  let ensureXmlDirectoryCalls = 0
  let confirmStateCalls = 0
  let profileConfirmCalls = 0
  let workerPoolCreations = 0
  let targetKind: ComponentAddress["kind"] = "configuration"
  let readingBase = false
  const topology = compileRegisteredMetadataResourceTopology()
  const readToken = createTestProjectStateReadToken()
  const projectState = {
    workers: createUnusedMetadataWorkerPool(),
    async beginImport() { throw new Error("not used") },
    async refreshAndValidate() {
      events.push("refresh")
      if (options.refreshFailure !== undefined) throw options.refreshFailure
      return {
        diagnostics: createMetadataDiagnosticCollectionFromDiagnostics(options.refreshDiagnostics ?? []),
        readToken,
        stats: { hashedFiles: 1, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 },
      }
    },
    async createReadToken() { return createTestProjectStateReadToken() },
    async readComponentProjection({ componentPath }: { componentPath: string }) {
      projectionReads.push(componentPath)
      const hashBytes = new Uint8Array(8)
      new DataView(hashBytes.buffer).setBigUint64(0, 10n, false)
      return { componentPath, projectFiles: [{ projectPath: `${componentPath}/Конфигурация.yaml` }], hashBytes }
    },
    openReadSession() { return emptyProjectStateReadSession() },
    async reset() {},
    async rebuild() { throw new Error("not used") },
    async close() {},
  } satisfies import("../projectState").ProjectStateService

  const deps: FullXmlSyncCoordinatorDependencies = createMockFullSyncDependencies({
    async exists(path) {
      if (path === resolve("/project")) events.push("preflight")
      return path === resolve("/project")
    },
    async isDirectoryEmpty() {
      return true
    },
    async mkdir() {
      ensureXmlDirectoryCalls += 1
    },
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
      return snapshot(address, options)
    },
    async readHashes({ structure: value }) {
      events.push(readingBase ? "baseHashes" : "targetHashes")
      return hashes(value, options.previousFiles)
    },
    confirmState(params) {
      confirmStateCalls += 1
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
          profileConfirmCalls += 1
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
      workerPoolCreations += 1
      return {
        async initialize(params) {
          initializedWithBase = params.componentPath.startsWith("cfe/")
        },
        async execute(): Promise<FullXmlSyncExecutionPoolResult> {
          events.push("execute")
          return {
            diagnostics: createFullXmlSyncDiagnosticCollectionFromDiagnostics(options.executionDiagnostics ?? []),
            warnings: createFullXmlSyncDiagnosticCollectionFromDiagnostics([]),
            writtenFiles: createFullXmlSyncFileCollectionFromFiles([{
              assignmentId: "Конфигурация.yaml",
              targetXmlPath: "Configuration.xml",
            }]),
            expectedOutputs: createFullXmlSyncFileCollectionFromFiles([{
              assignmentId: "Конфигурация.yaml",
              targetXmlPath: "Configuration.xml",
            }]),
            fragmentData: options.fragmentData ?? {
              sourceProjectPaths: ["Конфигурация.yaml"],
              entities: [],
            },
          }
        },
        async close() {
          events.push("close")
          if (options.closeFailure !== undefined) throw options.closeFailure
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
  })

  return {
    events,
    projectionReads,
    deps,
    projectState,
    get writtenIndex() {
      return writtenIndex
    },
    get writtenAddress() {
      return writtenAddress
    },
    get initializedWithBase() {
      return initializedWithBase
    },
    get ensureXmlDirectoryCalls() {
      return ensureXmlDirectoryCalls
    },
    get confirmStateCalls() {
      return confirmStateCalls
    },
    get profileConfirmCalls() {
      return profileConfirmCalls
    },
    get workerPoolCreations() {
      return workerPoolCreations
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

function hashes(
  structure: ComponentProjectStructure,
  projectFiles: ConfigurationSnapshot["files"] = [{ projectPath: "Конфигурация.yaml", contentHash: 10n }]
): ComponentHashState {
  return {
    componentPath: structure.componentPath,
    projectFiles,
  }
}

function snapshot(address: ComponentAddress, options: HarnessOptions) {
  const componentPath =
    address.kind === "configuration" ? "cf" : `cfe/${address.name}`
  return snapshotConfigurationIndex(encodeConfigurationIndex({
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath,
    files: options.previousFiles ?? [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
    entities: options.previousEntities ?? [entity("СтароеСостояние", "Конфигурация.yaml")],
  }))
}
