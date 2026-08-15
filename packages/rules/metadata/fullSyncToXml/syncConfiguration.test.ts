import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import type {
  ConfigurationIndexBlockFragment,
  ConfigurationProjectFile,
} from "@nkdk/runtime"
import type { ConfigurationIndexCandidateStore } from "@nkdk/runtime/configuration-index-store"
import type { ComponentAddress } from "@nkdk/runtime"
import type {
  ComponentHashState,
  ComponentProjectStructure,
} from "../project/componentState"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import type { MetadataProjectResourceMatch } from "../resourceTopology/core/projectProjection"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import {
  createConfigurationLanguages,
  createMetadataDiagnosticCollectionFromDiagnostics,
  type ConfigurationLanguages,
} from "@nkdk/runtime"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { FullXmlSyncDiagnostic } from "./types"
import {
  planSyncConfigurationToXml,
  syncComponentToXml,
  type FullXmlSyncCoordinatorDependencies,
} from "./syncConfiguration"
import {
  createFakeConfigurationIndexStore,
  createMockFullSyncDependencies,
  emptyProjectStateReadSession,
} from "./testHelpers"
import {
  createFullXmlSyncDiagnosticCollectionFromDiagnostics,
  createFullXmlSyncFileCollectionFromFiles,
  type FullXmlSyncExecutionPoolResult,
} from "./workerPool"
import { createUnusedMetadataWorkerPool } from "../../tests/metadataWorkerTestPool"

const defaultHarnessLanguages = createConfigurationLanguages({ default: "ru", registered: ["ru"] })

describe("shared full XML sync coordinator", () => {
  const context = {
    version: "2.20",
    languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
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
      "targetHashes",
      "targetSnapshot",
      "confirmTarget",
      "buildSelection",
      "execute",
      "transferExternal",
      "validateOutput",
      "publishTargetIndex",
      "close",
    ])
    expect(harness.writtenIndex?.hashes).toEqual([
      { projectPath: "Конфигурация.yaml", contentHash: 10n },
    ])
    expect(harness.writtenIndex?.fragments).toEqual([
      { targetProjectPath: "Конфигурация.yaml", entities: [] },
    ])
  })

  it("loads project languages before refresh and worker initialization", async () => {
    const loadedLanguages = createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] })
    const harness = createHarness({ loadedLanguages })

    const result = await runHarnessSync(harness, { ignoreValidationErrors: false, selected: false })

    expect(result.failed).toEqual([])
    expect(harness.refreshedLanguages).toBe(loadedLanguages)
    expect(harness.initializedLanguages).toBe(loadedLanguages)
  })

  it("останавливает full sync до refresh при ошибке реестра языков", async () => {
    const harness = createHarness({ languageRegistryFailure: new Error("Основной язык не зарегистрирован: ru") })

    const result = await runHarnessSync(harness, { ignoreValidationErrors: false, selected: false })

    expect(result.succeeded).toBe(0)
    expect(result.failed).toEqual([expect.objectContaining({ message: "Основной язык не зарегистрирован: ru" })])
    expect(harness.events).not.toContain("refresh")
    expect(harness.workerPoolCreations).toBe(0)
  })

  it("записывает тонкий снимок результата полного sync через публичный entrypoint", async () => {
    const harness = createHarness({
      fragmentData: {
        targetProjectPath: "Конфигурация.yaml",
        entities: [{
          logicalAddress: "Конфигурация",
          uuid: "00000000-0000-4000-8000-000000000001",
          xmlId: "Configuration42",
        }],
      },
    })

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, harness.deps)

    expect(result.failed).toEqual([])
    expect(JSON.stringify(harness.writtenIndex?.fragments)).not.toMatch(
      /"xmlName"|"present"|"xsiNil"|"explicitEmpty"|"xsiType"|"xmlText"|"xmlPrefix"/u,
    )
  })

  it("останавливается до refresh и записи XML при ожидающем частичном пакете", async () => {
    const harness = createHarness()

    const result = await syncComponentToXml({
      context,
      projectDir: "/project",
      componentPath: "cf",
      xmlDir: "/out",
      projectState: harness.projectState,
    }, {
      ...harness.deps,
      assertNoPending() { throw new Error("существует ожидающий пакет") },
    })

    expect(result.failed).toEqual([expect.objectContaining({ message: "существует ожидающий пакет" })])
    expect(harness.events).toEqual([])
    expect(harness.workerPoolCreations).toBe(0)
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
          "refresh", "preflight", "targetStructure", "targetHashes", "targetSnapshot", "confirmTarget",
          "buildSelection", "execute", "transferExternal", "validateOutput", "publishTargetIndex", "close",
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
      "refresh", "preflight", "targetStructure", "targetHashes", "targetSnapshot", "confirmTarget",
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
      "targetHashes",
      "targetSnapshot",
      "confirmTarget",
      "baseStructure",
      "baseHashes",
      "baseSnapshot",
      "confirmBase",
      "buildSelection",
      "execute",
      "transferExternal",
      "validateOutput",
      "publishTargetIndex",
      "close",
    ])
    expect(harness.initializedWithBase).toBe(true)
    expect(result.configurationIndexPath).toContain("cfe/Дополнение/configuration-index.lmdb")
  })

  it.each(["sync", "preview"] as const)("prepares the component profile before %s", async (mode) => {
    const harness = createHarness()
    const resolveProfile = harness.deps.resolveProfile
    const readPaths: string[] = []
    let preparations = 0
    const deps = {
      ...harness.deps,
      async readFile(path: string) {
        readPaths.push(path)
        return Buffer.from("РежимСовместимостиРасширенияКонфигурации: Версия8_3_20\n")
      },
      resolveProfile(address: ComponentAddress) {
        return {
          ...resolveProfile(address),
          prepareRuntime({ runtime, rootYaml }: {
            readonly runtime: import("./componentProfile").FullXmlSyncProfileRuntime
            readonly rootYaml: unknown
          }) {
            preparations++
            expect(rootYaml).toEqual({
              РежимСовместимостиРасширенияКонфигурации: "Версия8_3_20",
            })
            return {
              ...runtime,
              workerProfile: {
                ...runtime.workerProfile,
                typeDescriptionXMLNameByType: { AnyIBRef: "AnyRef" },
              },
            }
          },
        }
      },
    }
    const common = {
      projectDir: "/project",
      componentPath: "cfe/Дополнение",
      xmlDir: "/out",
      projectState: harness.projectState,
    }

    const result = mode === "sync"
      ? await syncComponentToXml({ ...common, context }, deps)
      : await planSyncConfigurationToXml(common, deps)

    expect("failed" in result ? result.failed : []).toEqual([])
    expect(preparations).toBe(1)
    expect(readPaths).toEqual([resolve("/project/cfe/Дополнение/Конфигурация.yaml")])
    if (mode === "sync") {
      expect(harness.initializedProfile?.typeDescriptionXMLNameByType).toEqual({ AnyIBRef: "AnyRef" })
    }
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

})

interface HarnessOptions {
  readonly loadedLanguages?: ConfigurationLanguages
  readonly languageRegistryFailure?: Error
  readonly executionDiagnostics?: readonly FullXmlSyncDiagnostic[]
  readonly fragmentData?: ConfigurationIndexBlockFragment
  readonly previousFiles?: readonly ConfigurationProjectFile[]
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
  let writtenIndex: { hashes: readonly ConfigurationProjectFile[]; fragments: readonly ConfigurationIndexBlockFragment[] } | undefined
  let initializedWithBase = false
  let initializedProfile: import("./componentProfile").FullXmlSyncWorkerProfileRuntime | undefined
  let ensureXmlDirectoryCalls = 0
  let confirmStateCalls = 0
  let profileConfirmCalls = 0
  let workerPoolCreations = 0
  let refreshedLanguages: ConfigurationLanguages | undefined
  let initializedLanguages: ConfigurationLanguages | undefined
  let targetKind: ComponentAddress["kind"] = "configuration"
  let readingBase = false
  const topology = compileRegisteredMetadataResourceTopology()
  const readToken = createTestProjectStateReadToken()
  const projectState = {
    workers: createUnusedMetadataWorkerPool(),
    async beginImport() { throw new Error("not used") },
    async refreshAndValidate(params) {
      events.push("refresh")
      refreshedLanguages = params.context?.languages
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
    async loadLanguages() {
      if (options.languageRegistryFailure !== undefined) throw options.languageRegistryFailure
      return options.loadedLanguages ?? defaultHarnessLanguages
    },
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
                      snapshot: base.snapshot.descriptor,
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
          initializedProfile = params.profile
          initializedLanguages = params.context.languages
        },
        async execute(_assignments, executionOptions): Promise<FullXmlSyncExecutionPoolResult> {
          events.push("execute")
          await executionOptions?.onBatch?.({
            generatedDocuments: [],
            configurationFragments: [options.fragmentData ?? {
              targetProjectPath: "Конфигурация.yaml",
              entities: [],
            }],
          })
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
    openIndexStore: () => createFakeConfigurationIndexStore(),
    async createIndexCandidate() { return fakeCandidateStore() },
    async publishCandidate({ candidate }) {
      events.push("publishTargetIndex")
      const captured = candidate as ReturnType<typeof fakeCandidateStore>
      writtenIndex = { hashes: captured.capturedHashes(), fragments: captured.capturedFragments() }
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
    get initializedWithBase() {
      return initializedWithBase
    },
    get initializedProfile() {
      return initializedProfile
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
    get refreshedLanguages() {
      return refreshedLanguages
    },
    get initializedLanguages() {
      return initializedLanguages
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
    resources: [configurationResource("Конфигурация.yaml")],
    projectPaths: ["Конфигурация.yaml"],
  }
}

function configurationResource(projectPath: string): MetadataProjectResourceMatch {
  return {
    kind: "content",
    projectPath,
    assignment: undefined,
    values: {},
    role: "configuration",
    rule: undefined,
    owner: undefined,
    compositionImpact: "none",
  }
}

function hashes(
  structure: ComponentProjectStructure,
  projectFiles: readonly ConfigurationProjectFile[] = [{ projectPath: "Конфигурация.yaml", contentHash: 10n }]
): ComponentHashState {
  return {
    componentPath: structure.componentPath,
    projectFiles,
  }
}

function snapshot(address: ComponentAddress, options: HarnessOptions) {
  const componentPath =
    address.kind === "configuration" ? "cf" : `cfe/${address.name}`
  return {
    descriptor: {
      dataPath: `/project/.nkdk/components/${componentPath}/configuration-index.lmdb`,
      lockPath: `/project/.nkdk/components/${componentPath}/configuration-index.lmdb-lock`,
      schemaVersion: 1,
    },
    projectFiles: options.previousFiles ?? [{ projectPath: "Конфигурация.yaml", contentHash: 10n }],
  }
}

function fakeCandidateStore(): ConfigurationIndexCandidateStore & {
  capturedHashes(): readonly ConfigurationProjectFile[]
  capturedFragments(): readonly ConfigurationIndexBlockFragment[]
} {
  let hashes: readonly ConfigurationProjectFile[] = []
  const fragments: ConfigurationIndexBlockFragment[] = []
  return {
    ...createFakeConfigurationIndexStore(),
    replaceHashes(value) { hashes = [...value] },
    mergeBlockFragment(fragment) { fragments.push(fragment) },
    copyActiveBlocksFrom() {},
    validateCandidate() {},
    async discard() {},
    capturedHashes: () => hashes,
    capturedFragments: () => fragments,
  }
}
