import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockContextFromXML } from "../../tests/mockContext"
import {
  configurationIndexPath,
  type ConfigurationSnapshot,
  type MergedConfigurationSnapshotFragments,
} from "../configurationIndex"
import type { ComponentAddress } from "../components/address"
import type { ValidationIndexContribution } from "../validation/projectValidationTypes"
import { createProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "../projectState/binary/fragment"
import type {
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportSession,
  ProjectStateService,
} from "../projectState"
import { createUnusedMetadataWorkerPool } from "../../tests/metadataWorkerTestPool"
import { createMetadataDiagnosticCollectionFromDiagnostics } from "../diagnostics/collection"
import {
  importConfigurationFromXml,
  type ImportConfigurationFromXmlParams,
  type ImportCoordinatorDependencies,
} from "./importConfiguration"
import type { ImportAssignment, ImportDiagnostic, ImportResultFile } from "./types"
import type { ImportDiagnosticCollection, ImportResultFileCollection } from "./workerPool"

const failurePhases = [
  "discover",
  "firstPass",
  "secondPass",
  "mergeFiles",
  "transferExternalFiles",
  "hashProject",
  "writeIndex",
] as const

type FailurePhase = (typeof failurePhases)[number]

const catalogProjectPath = "Справочник/Контрагенты/Свойства.yaml"
const formProjectPath = "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml"
const emptyProjectPath = "БезФактов.yaml"
const assignments: ImportAssignment[] = [assignment("Контрагенты"), formAssignment(), assignmentWithoutSnapshotFacts()]
const resultFiles: ImportResultFile[] = [
  {
    sourceKind: "worker",
    sourcePath: "/temp/Конфигурация.yaml",
    targetProjectPath: "Конфигурация.yaml",
  },
  {
    sourceKind: "worker",
    sourcePath: "/temp/Свойства.yaml",
    targetProjectPath: catalogProjectPath,
  },
  {
    sourceKind: "worker",
    sourcePath: "/temp/Форма.yaml",
    targetProjectPath: formProjectPath,
  },
  {
    sourceKind: "worker",
    sourcePath: "/temp/БезФактов.yaml",
    targetProjectPath: emptyProjectPath,
  },
]
const firstPassFiles = resultFiles.slice(0, 2)
const secondPassFiles = resultFiles.slice(2)
const fragmentData: MergedConfigurationSnapshotFragments = {
  sourceProjectPaths: [catalogProjectPath, emptyProjectPath, formProjectPath],
  entities: [
    {
      logicalAddress: "Справочник.Контрагенты",
      sourceProjectPath: catalogProjectPath,
      identities: { uuid: "00000000-0000-4000-8000-000000000001" },
    },
    {
      logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
      sourceProjectPath: formProjectPath,
      xml: { explicitEmpty: true },
    },
  ],
}
const projectFiles = resultFiles.map((file, index) => ({
  projectPath: file.targetProjectPath,
  contentHash: BigInt(index + 1),
}))

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true, force: true })))
})

describe("configuration XML import coordinator", () => {
  it("detects the main configuration and writes it to cf", async () => {
    const calls: string[] = []
    const params = createParams("configuration")
    const writtenIndexes: Array<{ address: ComponentAddress; data: ConfigurationSnapshot }> = []
    const initialized: Array<{ outputDir: string; componentKind: string; metadataItemAugmenter?: string }> = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls, writtenIndexes, initialized }))

    expect(result).toEqual({
      componentPath: "cf",
      succeeded: assignments.length,
      failed: [],
      warnings: [],
      configurationIndexPath: configurationIndexPath(params.projectDir, { kind: "configuration" }),
    })
    expect(initialized).toEqual([
      {
        outputDir: join(params.projectDir, "cf"),
        componentKind: "configuration",
      },
    ])
    expect(writtenIndexes).toEqual([
      {
        address: { kind: "configuration" },
        data: configurationIndex("cf"),
      },
    ])
    const snapshot = writtenIndexes[0]?.data
    expect(snapshot?.entities.find(({ logicalAddress }) => logicalAddress === "Справочник.Контрагенты")).toMatchObject({
      sourceProjectPath: catalogProjectPath,
    })
    expect(
      snapshot?.entities.find(({ logicalAddress }) => logicalAddress === "Справочник.Контрагенты.Форма.ФормаЭлемента")
    ).toMatchObject({ sourceProjectPath: formProjectPath })
    expect(
      snapshot?.entities.every((entity) => snapshot.files.some((file) => file.projectPath === entity.sourceProjectPath))
    ).toBe(true)
    expect(snapshot?.entities.every(hasMeaningfulPayload)).toBe(true)
    expect(snapshot?.files).toContainEqual(expect.objectContaining({ projectPath: emptyProjectPath }))
    expect(snapshot?.entities).not.toContainEqual(expect.objectContaining({ sourceProjectPath: emptyProjectPath }))
  })

  it("detects Расширение_All and writes it to cfe/Расширение_All", async () => {
    const calls: string[] = []
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const writtenIndexes: Array<{ address: ComponentAddress; data: ConfigurationSnapshot }> = []
    const initialized: Array<{ outputDir: string; componentKind: string; metadataItemAugmenter?: string }> = []
    let secondPassTokenCount = 0
    const dependencies = fakeDependencies({ calls, writtenIndexes, initialized })
    const pool = dependencies.createWorkerPool!({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass(snapshots, sink) {
        calls.push("secondPass")
        secondPassTokenCount = snapshots.length
        await sink?.writeSecondPassState({
          stateFragment: finalStateFragment(stateBatch(secondPassFiles, 3, "cfe/Расширение_All")),
        })
        return {
          diagnostics: diagnosticCollection([]),
          warnings: diagnosticCollection([]),
          files: fileCollection(secondPassFiles),
        }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: assignments.length,
      failed: [],
      configurationIndexPath: configurationIndexPath(params.projectDir, {
        kind: "configurationExtension",
        name: "Расширение_All",
      }),
    })
    expect(initialized).toEqual([
      {
        outputDir: join(params.projectDir, "cfe", "Расширение_All"),
        componentKind: "configurationExtension",
        metadataItemAugmenter: "configurationExtension",
      },
    ])
    expect(secondPassTokenCount).toBe(1)
    expect(writtenIndexes[0]).toMatchObject({
      address: { kind: "configurationExtension", name: "Расширение_All" },
      data: {
        specificationVersion: "1.3",
        componentPath: "cfe/Расширение_All",
        indexGeneration: 1n,
      },
    })
    expect(calls.indexOf("baseMetadata")).toBeLessThan(calls.indexOf("discover"))
  })

  it("accepts only a requested component path matching the detected extension", async () => {
    const matching = createParams("configurationExtension")
    matching.requestedComponentPath = "cfe/Расширение_All"
    createBaseConfiguration(matching.projectDir)

    const matchingResult = await importConfigurationFromXml(matching, fakeDependencies({ calls: [] }))

    expect(matchingResult.failed).toEqual([])

    const mismatching = createParams("configurationExtension")
    mismatching.requestedComponentPath = "cf"
    createBaseConfiguration(mismatching.projectDir)
    const calls: string[] = []

    const mismatchingResult = await importConfigurationFromXml(mismatching, fakeDependencies({ calls }))

    expect(mismatchingResult).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/не совпадает/iu) })],
    })
    expect(calls).toEqual([])
  })

  it("rejects an extension without cf before XML discovery", async () => {
    const params = createParams("configurationExtension")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/базов.*cf/iu) })],
    })
    expect(calls).toEqual([])
    expect(fs.existsSync(join(params.projectDir, "cfe", "Расширение_All"))).toBe(false)
  })

  it.each(["missing", "empty"] as const)("accepts a %s component target", async (targetState) => {
    const params = createParams("configuration")
    if (targetState === "empty") fs.mkdirSync(join(params.projectDir, "cf"), { recursive: true })

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls: [] }))

    expect(result.failed).toEqual([])
  })

  it("rejects a nonempty extension target without deleting it", async () => {
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const target = join(params.projectDir, "cfe", "Расширение_All")
    const sentinel = join(target, "Сохранить.txt")
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(sentinel, "не удалять")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/не пуст/iu) })],
    })
    expect(fs.readFileSync(sentinel, "utf8")).toBe("не удалять")
    expect(calls).toEqual([])
  })

  it("rejects an existing extension snapshot before XML discovery", async () => {
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const snapshotPath = configurationIndexPath(params.projectDir, {
      kind: "configurationExtension",
      name: "Расширение_All",
    })
    fs.mkdirSync(join(snapshotPath, ".."), { recursive: true })
    fs.writeFileSync(snapshotPath, "existing snapshot")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toMatchObject({
      componentPath: "cfe/Расширение_All",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: expect.stringMatching(/снимок.*существ/iu) })],
    })
    expect(fs.readFileSync(snapshotPath, "utf8")).toBe("existing snapshot")
    expect(calls).toEqual([])
  })

  it("leaves a YAML file written before an error and does not write a snapshot", async () => {
    const params = createParams("configuration")
    const componentDir = join(params.projectDir, "cf")
    const yamlPath = join(componentDir, "Конфигурация.yaml")
    const calls: string[] = []
    const writtenIndexes: Array<{ address: ComponentAddress; data: ConfigurationSnapshot }> = []
    const diagnostic = importError("broken second pass")
    const dependencies = fakeDependencies({ calls, writtenIndexes })
    const pool = dependencies.createWorkerPool!({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass() {
        calls.push("secondPass")
        fs.mkdirSync(componentDir, { recursive: true })
        fs.writeFileSync(yamlPath, "Имя: ЧастичныйРезультат\n")
        return {
          diagnostics: diagnosticCollection([diagnostic]),
          warnings: diagnosticCollection([]),
          files: fileCollection([]),
        }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toEqual([diagnostic])
    expect(result.configurationIndexPath).toBeUndefined()
    expect(fs.readFileSync(yamlPath, "utf8")).toBe("Имя: ЧастичныйРезультат\n")
    expect(writtenIndexes).toEqual([])
    expect(fs.existsSync(configurationIndexPath(params.projectDir, { kind: "configuration" }))).toBe(false)
  })

  it("writes the snapshot strictly after direct YAML output, copying and hashing", async () => {
    const params = createParams("configuration")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(calls).toEqual([
      "discover",
      "initialize",
      "firstPass",
      "secondPass",
      "mergeFiles",
      "transferExternalFiles",
      "hashProject",
      "writeIndex",
      "closeWorkers",
    ])
    expect(result.configurationIndexPath).toBe(configurationIndexPath(params.projectDir, { kind: "configuration" }))
  })

  it.each(failurePhases)("does not publish a snapshot path after the %s failure", async (failurePhase) => {
    const params = createParams("configuration")
    const calls: string[] = []
    const yamlPath = join(params.projectDir, "cf", "Конфигурация.yaml")

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls, failurePhase }))

    expect(result).toMatchObject({
      componentPath: "cf",
      succeeded: 0,
      failed: [expect.objectContaining({ severity: "error", message: `${failurePhase} failed` })],
      warnings: [],
    })
    expect(result.configurationIndexPath).toBeUndefined()
    expect(calls.includes("writeIndex")).toBe(failurePhase === "writeIndex")
    expect(calls.at(-1)).toBe("closeWorkers")
    expect(fs.existsSync(yamlPath)).toBe(
      ["mergeFiles", "transferExternalFiles", "hashProject", "writeIndex"].includes(failurePhase)
    )
  })

  it("не маскирует primary failure ошибками cleanup до публикации", async () => {
    const params = createParams("configuration")
    const dependencies = fakeDependencies({
      calls: [],
      failurePhase: "firstPass",
      workerCloseFailure: new Error("worker cleanup failed"),
      projectStateCloseFailure: new Error("state cleanup failed"),
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed.map(({ message }) => message)).toEqual([
      "firstPass failed",
      "worker cleanup failed",
      "state cleanup failed",
    ])
  })

  it("закрывает pool и ждёт оставшийся sink до abort session", async () => {
    const params = createParams("configuration")
    const primary = new Error("first sink failed")
    const secondSink = gate()
    const events: string[] = []
    let aborted = false
    let writesAfterAbort = 0
    const activeSinks: Promise<void>[] = []
    params.projectState = projectStateWithImportSession({
      async writeStateFragment(fragment) {
        const view = openProjectStateFragment(fragment)
        const projectPath = view.stringValue(view.fileRecord(0).projectPathId)
        if (projectPath === "cf/first.yaml") {
          await secondSink.started
          throw primary
        }
        secondSink.start()
        await secondSink.wait()
        if (aborted) writesAfterAbort += 1
        events.push("second-write")
      },
      async abort() {
        aborted = true
        events.push("abort")
      },
    })
    const dependencies = fakeDependencies({ calls: [] })
    dependencies.createWorkerPool = () => ({
      async initialize() {},
      async runFirstPass(_assignments, sink) {
        activeSinks.push(
          sink!.writeFirstPassState({
            stateFragment: indexStateFragment("cf/first.yaml"),
          }),
          sink!.writeFirstPassState({
            stateFragment: indexStateFragment("cf/second.yaml"),
          }),
        )
        await activeSinks[0]
        throw new Error("unreachable")
      },
      async runSecondPass() { throw new Error("unexpected second pass") },
      workerCount() { return 2 },
      async close() {
        events.push("close:start")
        await Promise.allSettled(activeSinks)
        events.push("close:end")
      },
    })

    const running = importConfigurationFromXml(params, dependencies)
    await secondSink.started
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(events).not.toContain("abort")
    secondSink.release()
    const result = await running

    expect(result.failed.map(({ message }) => message)).toEqual([primary.message])
    expect(events).toEqual(["close:start", "second-write", "close:end", "abort"])
    expect(writesAfterAbort).toBe(0)
  })

  it("сохраняет порядок primary, pool close и session abort failures", async () => {
    const params = createParams("configuration")
    const primary = new Error("primary failed")
    const closeFailure = new Error("pool close failed")
    const abortFailure = new Error("session abort failed")
    params.projectState = projectStateWithImportSession({
      async abort() { throw abortFailure },
    })
    const dependencies = fakeDependencies({ calls: [], failurePhase: "firstPass" })
    dependencies.createWorkerPool = () => ({
      async initialize() {},
      async runFirstPass() { throw primary },
      async runSecondPass() { throw new Error("unexpected second pass") },
      workerCount() { return 1 },
      async close() { throw closeFailure },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed.map(({ message }) => message)).toEqual([
      primary.message,
      closeFailure.message,
      abortFailure.message,
    ])
  })

  it("не маскирует AggregateError finalize повторным abort coordinator", async () => {
    const params = createParams("configuration")
    const primary = new Error("checkpoint failed")
    const cleanup = new Error("discard failed")
    params.projectState = projectStateWithImportSession({
      async commitWorkingIndex() { return new Uint8Array([1]) as never },
      async finalize(beforeCheckpoint) {
        await beforeCheckpoint?.()
        throw new AggregateError([primary, cleanup], primary.message)
      },
    })

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls: [] }))

    expect(result.failed.map(({ message }) => message)).toEqual([
      primary.message,
      cleanup.message,
    ])
  })

  it("после публикации cleanup failure не превращает успешный import в failure", async () => {
    const params = createParams("configuration")
    const result = await importConfigurationFromXml(params, fakeDependencies({
      calls: [],
      workerCloseFailure: new Error("worker cleanup failed"),
      projectStateCloseFailure: new Error("state cleanup failed"),
    }))

    expect(result).toMatchObject({ succeeded: assignments.length, failed: [] })
  })

  it("does not read unrelated XML before a preflight failure", async () => {
    const params = createParams("configurationExtension")
    createBaseConfiguration(params.projectDir)
    const target = join(params.projectDir, "cfe", "Расширение_All")
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(join(target, "existing.yaml"), "")
    fs.mkdirSync(join(params.inputDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(params.inputDir, "Catalogs", "Broken.xml"), "<broken")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result.failed).toEqual([expect.objectContaining({ message: expect.stringMatching(/не пуст/iu) })])
    expect(calls).toEqual([])
  })

  it("returns a diagnostic for an unknown Configuration.xml root", async () => {
    const params = createParams("unknown")
    const calls: string[] = []

    const result = await importConfigurationFromXml(params, fakeDependencies({ calls }))

    expect(result).toEqual({
      succeeded: 0,
      failed: [
        expect.objectContaining({
          severity: "error",
          code: "xml_import_operation_failed",
          message: expect.stringMatching(/не найдено.*XML-компонента/iu),
        }),
      ],
      warnings: [],
    })
    expect(calls).toEqual([])
  })

  it("preserves second-pass warnings when its diagnostics contain errors", async () => {
    const params = createParams("configuration")
    const calls: string[] = []
    const diagnostic = importError("broken second pass")
    const warning: ImportDiagnostic = {
      severity: "warning",
      code: "unresolved_data_path",
      message: "unresolved",
      targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    }
    const dependencies = fakeDependencies({ calls })
    const pool = dependencies.createWorkerPool!({ concurrency: 1 })
    dependencies.createWorkerPool = () => ({
      ...pool,
      async runSecondPass() {
        calls.push("secondPass")
        return {
          diagnostics: diagnosticCollection([diagnostic]),
          warnings: diagnosticCollection([warning]),
          files: fileCollection([]),
        }
      },
    })

    const result = await importConfigurationFromXml(params, dependencies)

    expect(result.failed).toEqual([diagnostic])
    expect(result.warnings).toEqual([warning])
  })

  it("emits import profile records for main coordinator steps", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_PROFILE"]
    let lines: string[] = []
    process.env["NKDK_PROFILE"] = "1"
    try {
      await importConfigurationFromXml(createParams("configuration"), fakeDependencies({ calls: [] }))
      lines = error.mock.calls.map(([line]) => String(line))
    } finally {
      if (previous === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previous
      error.mockRestore()
    }

    expect(
      lines.some(
        (line) =>
          line.includes("[nkdk-profile-step]") &&
          line.includes('operation="import-from-xml"') &&
          line.includes('substep="Поиск XML-файлов выгрузки"')
      )
    ).toBe(true)
    expect(
      lines.some(
        (line) =>
          line.includes("[nkdk-profile-step]") && line.includes('substep="Копирование внешних файлов XML-выгрузки"')
      )
    ).toBe(true)
    expect(lines.some((line) => line.includes('substep="Перенос результата импорта в проект"'))).toBe(false)
    for (const substep of [
      "Фиксация рабочего индекса",
      "Построение окончательного состояния",
      "Полная проверка зависимостей",
      "Сохранение состояния проекта",
      "Публикация состояния проекта",
    ]) {
      expect(lines.some((line) => line.includes(`substep=${JSON.stringify(substep)}`))).toBe(true)
    }
  })

  it.each([
    [undefined, "copy"],
    ["move", "move"],
  ] as const)("passes transfer strategy %s", async (externalFileTransfer, expected) => {
    const transfers: string[] = []
    const dependencies = fakeDependencies({ calls: [], transfers })

    await importConfigurationFromXml(
      {
        ...createParams("configuration"),
        ...(externalFileTransfer === undefined ? {} : { externalFileTransfer }),
      },
      dependencies
    )

    expect(transfers).toEqual([expected])
  })
})

function createParams(kind: "configuration" | "configurationExtension" | "unknown"): ImportConfigurationFromXmlParams {
  const projectDir = temporaryDirectory("nkdk-import-project-")
  const inputDir = temporaryDirectory("nkdk-import-xml-")
  fs.writeFileSync(
    join(inputDir, "Configuration.xml"),
    kind === "configuration"
      ? configurationXml()
      : kind === "configurationExtension"
        ? configurationExtensionXml()
        : "<MetaDataObject><Unknown/></MetaDataObject>"
  )
  return {
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: 2,
    operationId: "task-6",
  }
}

function fakeDependencies(params: {
  calls: string[]
  failurePhase?: FailurePhase
  writtenIndexes?: Array<{ address: ComponentAddress; data: ConfigurationSnapshot }>
  initialized?: Array<{ outputDir: string; componentKind: string; metadataItemAugmenter?: string }>
  transfers?: string[]
  workerCloseFailure?: Error
  projectStateCloseFailure?: Error
}): ImportCoordinatorDependencies {
  let componentDir: string | undefined
  let selectedComponentPath = "cf"
  const call = (phase: FailurePhase): void => {
    params.calls.push(phase)
    if (params.failurePhase === phase) throw new Error(`${phase} failed`)
  }

  return {
    createWorkerPool() {
      return {
        async writeStateFragment() {},
        async initialize(initializeParams) {
          params.calls.push("initialize")
          componentDir = initializeParams.outputDir
          selectedComponentPath = initializeParams.componentPath ?? "cf"
          params.initialized?.push({
            outputDir: initializeParams.outputDir,
            componentKind: initializeParams.componentKind,
            ...(initializeParams.metadataItemAugmenter === undefined
              ? {}
              : { metadataItemAugmenter: initializeParams.metadataItemAugmenter }),
          })
        },
        async runFirstPass(_assignments, sink) {
          call("firstPass")
          const fragments = fragmentData.sourceProjectPaths.map((targetProjectPath) => ({
            targetProjectPath,
            entities: fragmentData.entities.filter((entity) => entity.sourceProjectPath === targetProjectPath),
          }))
          for (let index = 0; index < fragments.length; index += 1) {
            await sink?.writeFirstPassState({
              configurationFragment: fragments[index],
              ...(index === 0
                ? { stateFragment: finalStateFragment(stateBatch(firstPassFiles, 1, selectedComponentPath)) }
                : {}),
            })
          }
          return {
            diagnostics: diagnosticCollection([]),
            ownerFacts: [],
            validationContribution: emptyValidationContribution(),
            files: fileCollection(firstPassFiles),
          }
        },
        async runSecondPass(_tokens, sink) {
          call("secondPass")
          if (componentDir === undefined) throw new Error("Worker pool не инициализирован")
          fs.mkdirSync(componentDir, { recursive: true })
          fs.writeFileSync(join(componentDir, "Конфигурация.yaml"), "Имя: Конфигурация\n")
          await sink?.writeSecondPassState({
            stateFragment: finalStateFragment(stateBatch(secondPassFiles, 3, selectedComponentPath)),
          })
          return {
            diagnostics: diagnosticCollection([]),
            warnings: diagnosticCollection([]),
            files: fileCollection(secondPassFiles),
          }
        },
        workerCount() { return 1 },
        async close() {
          params.calls.push("closeWorkers")
          if (params.workerCloseFailure !== undefined) throw params.workerCloseFailure
        },
      }
    },
    async discover() {
      call("discover")
      return { assignments }
    },
    createProjectStateService() {
      return fakeProjectState(params.calls, params.projectStateCloseFailure)
    },
    mergeFiles(files) {
      call("mergeFiles")
      return [...files]
    },
    async transferExternalFiles({ transfer }) {
      call("transferExternalFiles")
      params.transfers?.push(transfer)
    },
    async hashProject(_projectDir, projectPaths) {
      call("hashProject")
      expect(projectPaths).toEqual([])
      return []
    },
    async writeIndex({ address, data }) {
      call("writeIndex")
      params.writtenIndexes?.push({ address, data })
    },
  }
}

function stateBatch(
  files: readonly ImportResultFile[],
  firstHash: number,
  componentPath = "cf",
): ProjectStateImportFinalFileStateBatch {
  const entries = files.map((file, index) => ({
    update: {
      kind: "resource" as const,
      projectPath: `${componentPath}/${file.targetProjectPath}`,
      componentPath,
      resourceKind: "resource" as const,
    },
    hash: BigInt(firstHash + index),
  }))
  const batch = createProjectStateFileUpdateBatch(entries)
  return { updates: entries.map(({ update }) => update), hashBytes: batch.hashBytes }
}

function indexStateFragment(projectPath: string) {
  const writer = createProjectStateFragmentWriter()
  writer.appendImportIndex({
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "properties",
    references: [],
    owners: [],
    fields: [],
    forms: [],
  })
  return writer.finish()
}

function finalStateFragment(batch: ProjectStateImportFinalFileStateBatch) {
  const writer = createProjectStateFragmentWriter()
  writer.appendImportFinal(batch)
  return writer.finish()
}

function fakeProjectState(calls: string[], closeFailure?: Error): ProjectStateService {
  let nextToken = 1
  const readToken = () => new Uint8Array([nextToken++]) as never
  return {
    workers: createUnusedMetadataWorkerPool(),
    async beginImport(importParams) {
      return {
        async commitWorkingIndex() {
          importParams.profile?.onPhase?.({ phase: "workingIndex", elapsedMs: 1 })
          return readToken()
        },
        async createReadToken() { return readToken() },
        async writeStateFragment(fragment) {
          const buffers = Object.values(fragment.buffers)
          structuredClone(fragment, { transfer: buffers })
          expect(buffers.every((buffer) => buffer.byteLength === 0)).toBe(true)
        },
        async finalize(beforeCheckpoint) {
          importParams.profile?.onPhase?.({ phase: "finalBuild", elapsedMs: 1 })
          importParams.profile?.onPhase?.({ phase: "dependencyValidation", elapsedMs: 1 })
          await beforeCheckpoint?.()
          importParams.profile?.onPhase?.({ phase: "save", elapsedMs: 1 })
          importParams.profile?.onPhase?.({ phase: "publication", elapsedMs: 1 })
          return {
            diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([]),
            readToken: readToken(),
            stats: { hashedFiles: 4, parsedYamlFiles: 0, changedFiles: 4, deletedFiles: 0 },
          }
        },
        async abort() {},
      }
    },
    async refreshAndValidate() {
      calls.push("baseMetadata")
      return {
        diagnostics: createMetadataDiagnosticCollectionFromDiagnostics([]),
        readToken: readToken(),
        stats: { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, deletedFiles: 0 },
      }
    },
    async createReadToken() { return readToken() },
    openReadSession() { throw new Error("not used") },
    async readComponentProjection() { throw new Error("not used") },
    async reset() {},
    async rebuild() { throw new Error("not used") },
    async close() {
      if (closeFailure !== undefined) throw closeFailure
    },
  }
}

function temporaryDirectory(prefix: string): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), prefix))
  tempDirs.push(directory)
  return directory
}

function gate() {
  let release!: () => void
  let start!: () => void
  const waiting = new Promise<void>((resolve) => { release = resolve })
  const started = new Promise<void>((resolve) => { start = resolve })
  return { started, release, start, wait: () => waiting }
}

function projectStateWithImportSession(
  overrides: Partial<ProjectStateImportSession>,
): ProjectStateService {
  const unexpected = async (): Promise<never> => { throw new Error("unexpected import session call") }
  const session: ProjectStateImportSession = {
    async writeStateFragment() {},
    commitWorkingIndex: unexpected,
    createReadToken: unexpected,
    finalize: unexpected,
    async abort() {},
    ...overrides,
  }
  return { async beginImport() { return session } } as unknown as ProjectStateService
}

function createBaseConfiguration(projectDir: string): void {
  fs.mkdirSync(join(projectDir, "cf"), { recursive: true })
}

function configurationXml(): string {
  return `
<MetaDataObject>
  <Configuration>
    <Properties>
      <Name>Основная</Name>
    </Properties>
  </Configuration>
</MetaDataObject>
`
}

function configurationExtensionXml(): string {
  return `
<MetaDataObject>
  <Configuration>
    <Properties>
      <Name>Расширение_All</Name>
      <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
    </Properties>
  </Configuration>
</MetaDataObject>
`
}

function assignment(name: string): ImportAssignment {
  return {
    id: `Справочник/${name}/Свойства.yaml`,
    role: "properties",
    targetProjectPath: `Справочник/${name}/Свойства.yaml`,
    itemType: "MetadataCatalog",
    itemName: name,
    logicalAddress: `Справочник.${name}`,
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath: `/xml/Catalogs/${name}.xml` }],
    externalFiles: [],
  }
}

function formAssignment(): ImportAssignment {
  return {
    id: formProjectPath,
    role: "fileItem",
    targetProjectPath: formProjectPath,
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
    owner: {
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    },
    xmlFiles: [{ role: "body", sourcePath: "/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml" }],
    externalFiles: [],
  }
}

function assignmentWithoutSnapshotFacts(): ImportAssignment {
  return {
    id: emptyProjectPath,
    role: "properties",
    targetProjectPath: emptyProjectPath,
    itemType: "TestWithoutSnapshotFacts",
    itemName: "БезФактов",
    logicalAddress: "Тест.БезФактов",
    owner: undefined,
    xmlFiles: [],
    externalFiles: [],
  }
}

function importError(message: string): ImportDiagnostic {
  return {
    severity: "error",
    code: "xml_import_assignment_failed",
    message,
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
  }
}

function diagnosticCollection(items: readonly ImportDiagnostic[]): ImportDiagnosticCollection {
  let released = false
  return {
    errors: items.filter(({ severity }) => severity === "error").length,
    warnings: items.filter(({ severity }) => severity === "warning").length,
    count: items.length,
    get released() { return released },
    release() { released = true },
    *[Symbol.iterator]() {
      if (released) throw new Error("Коллекция diagnostics освобождена")
      yield* items
    },
  }
}

function fileCollection(items: readonly ImportResultFile[]): ImportResultFileCollection {
  let released = false
  return {
    count: items.length,
    get released() { return released },
    release() { released = true },
    *[Symbol.iterator]() {
      if (released) throw new Error("Коллекция файлов import освобождена")
      yield* items
    },
  }
}

function configurationIndex(component: string): ConfigurationSnapshot {
  return {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath: component,
    files: projectFiles,
    entities: fragmentData.entities,
  }
}

function hasMeaningfulPayload(entity: ConfigurationSnapshot["entities"][number]): boolean {
  return entity.identities !== undefined || entity.omittedChildren !== undefined || entity.xml !== undefined
}

function emptyValidationContribution(): ValidationIndexContribution {
  return {
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    localDependencies: [],
    logicalAddresses: [],
  }
}
