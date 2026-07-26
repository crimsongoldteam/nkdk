import { availableParallelism } from "node:os"
import {
  configurationIndexPath,
  encodeConfigurationIndexFragments,
  hashConfigurationProjectFileList,
  mergeConfigurationIndexFragments,
  readConfigurationIndex,
  writeConfigurationIndexAtomically,
  type ConfigurationIndexData,
  type ConfigurationProjectFile,
  type ConfigurationIndexFragment,
} from "../configurationIndex"
import type { ConfigurationContextFromXML } from "../context/types"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { NKDK_CORE_VERSION } from "../../version"
import { createOperationProfiler } from "../validation/profile"
import { discoverXmlImport } from "./discovery"
import { createImportSharedMetadata } from "./metadataSnapshot"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { mergeImportResultFiles, transferXmlImportExternalFiles } from "./transfer"
import type {
  ExternalFileTransfer,
  ImportAssignment,
  ImportDiagnostic,
  ImportResultFile,
  ImportSnapshotFile,
} from "./types"
import { getMetadataSnapshotImportCapability } from "../resourceTopology/capabilities"
import {
  createXmlImportWorkerPool,
  type XmlImportWorkerPool,
  type XmlImportWorkerPoolHandle,
} from "./workerPool"

export interface ConfigurationImportResult {
  succeeded: number
  failed: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  configurationIndexPath?: string
}

export interface ImportConfigurationFromXmlParams {
  context: ConfigurationContextFromXML
  inputDir: string
  projectDir?: string
  outputDir: string
  concurrency?: number
  copyExternalConcurrency?: number
  externalFileTransfer?: ExternalFileTransfer
  hashConcurrency?: number
  operationId?: string
  xmlImportWorkerPoolHandle?: XmlImportWorkerPoolHandle
}

export interface ImportCoordinatorDependencies {
  createWorkerPool(params: { concurrency: number }): XmlImportWorkerPool
  discover(params: {
    xmlDir: string
  }): Promise<{ assignments: ImportAssignment[]; snapshotFiles?: ImportSnapshotFile[] }>
  collectSnapshotFragments?(params: {
    context: ConfigurationContextFromXML
    files: readonly ImportSnapshotFile[]
  }): Promise<ConfigurationIndexFragment[]>
  createSharedMetadata(facts: readonly ValidationOwnerFacts[]): SharedValidationSnapshot
  mergeFiles(files: readonly ImportResultFile[]): ImportResultFile[]
  transferExternalFiles(params: {
    projectDir: string
    files: readonly ImportResultFile[]
    concurrency?: number
    transfer: ExternalFileTransfer
  }): Promise<void>
  hashProject(projectDir: string, projectPaths: readonly string[], options: { concurrency?: number }): Promise<ConfigurationProjectFile[]>
  readIndex(params: { projectDir: string; baseId: string }): Promise<ConfigurationIndexData | undefined>
  writeIndex(params: { projectDir: string; data: ConfigurationIndexData }): Promise<void>
}

const defaultImportDependencies: ImportCoordinatorDependencies = {
  createWorkerPool: createXmlImportWorkerPool,
  async discover({ xmlDir }) {
    return discoverXmlImport({ xmlDir, topology: compileRegisteredMetadataResourceTopology() })
  },
  collectSnapshotFragments,
  createSharedMetadata: createImportSharedMetadata,
  mergeFiles: mergeImportResultFiles,
  transferExternalFiles: transferXmlImportExternalFiles,
  hashProject: hashConfigurationProjectFileList,
  readIndex: readConfigurationIndex,
  writeIndex: writeConfigurationIndexAtomically,
}

export async function importConfigurationFromXml(
  params: ImportConfigurationFromXmlParams,
  deps: ImportCoordinatorDependencies = defaultImportDependencies
): Promise<ConfigurationImportResult> {
  const operationId = params.operationId ?? "direct-write"
  const projectDir = params.projectDir ?? params.outputDir
  const profiler = createOperationProfiler({ operation: "import-from-xml", scope: { scope: "main" } })
  const pool =
    params.xmlImportWorkerPoolHandle?.createOperationPool() ??
    deps.createWorkerPool({ concurrency: normalizeConcurrency(params.concurrency) })
  let warnings: ImportDiagnostic[] = []

  try {
    const discovered = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Поиск XML-файлов выгрузки",
      {},
      () => deps.discover({ xmlDir: params.inputDir })
    )
    profiler.record("Подготовка импорта конфигурации", "Формирование и распределение заданий импорта", {
      items: discovered.assignments.length,
      timeMs: 0,
    })
    await profiler.measureAsync("Подготовка импорта конфигурации", "Инициализация worker", { items: discovered.assignments.length }, () =>
      pool.initialize({ operationId, context: params.context, outputDir: params.outputDir })
    )
    const first = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Первый проход worker",
      { items: discovered.assignments.length },
      () => pool.runFirstPass(discovered.assignments)
    )
    if (hasErrors(first.diagnostics)) return failedResult(first.diagnostics, [])
    const snapshotFragments = await (deps.collectSnapshotFragments ?? collectSnapshotFragments)({
      context: params.context,
      files: discovered.snapshotFiles ?? [],
    })
    const fragmentData = mergeConfigurationIndexFragments([
      encodeConfigurationIndexFragments([
        { targetProjectPath: "worker", ...first.fragmentData },
        ...snapshotFragments,
      ]),
    ])

    profiler.record("Подготовка импорта конфигурации", "Обобщение фрагментов данных файла индекса конфигурации", {
      items: discovered.assignments.length,
      timeMs: 0,
    })
    const sharedMetadata = profiler.measure(
      "Подготовка импорта конфигурации",
      "Обобщение индекса метаданных",
      { items: first.ownerFacts.length },
      () => deps.createSharedMetadata(first.ownerFacts)
    )
    profiler.record("Подготовка импорта конфигурации", "Распределение индекса метаданных", {
      items: discovered.assignments.length,
      timeMs: 0,
    })
    const second = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Второй проход worker",
      { items: discovered.assignments.length },
      () => pool.runSecondPass(sharedMetadata)
    )
    warnings = second.warnings
    if (hasErrors(second.diagnostics)) return failedResult(second.diagnostics, warnings)

    const files = profiler.measure(
      "Подготовка импорта конфигурации",
      "Обобщение списка файлов результата импорта",
      { items: second.files.length },
      () => deps.mergeFiles(second.files)
    )
    await profiler.measureAsync("Подготовка импорта конфигурации", "Копирование внешних файлов XML-выгрузки", { items: files.length }, () =>
      deps.transferExternalFiles({
        projectDir: params.outputDir,
        files,
        transfer: params.externalFileTransfer ?? "copy",
        ...(params.copyExternalConcurrency === undefined ? {} : { concurrency: params.copyExternalConcurrency }),
      })
    )
    const projectFiles = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Вычисление хэшей файлов проекта",
      {},
      () =>
        deps.hashProject(params.outputDir, files.map((file) => file.targetProjectPath), {
          ...(params.hashConcurrency === undefined ? {} : { concurrency: params.hashConcurrency }),
        })
    )
    const previousIndex = await readablePreviousIndex(deps, projectDir)
    const indexData = profiler.measure(
      "Подготовка импорта конфигурации",
      "Формирование данных файла индекса конфигурации",
      { items: projectFiles.length },
      () =>
        buildImportedConfigurationIndex({
          producerVersion: NKDK_CORE_VERSION,
          baseId: "default",
          indexGeneration: (previousIndex?.binding.indexGeneration ?? 0n) + 1n,
          projectFiles,
          fragmentData,
        })
    )
    await profiler.measureAsync("Подготовка импорта конфигурации", "Запись файла индекса конфигурации", { items: projectFiles.length }, () =>
      deps.writeIndex({ projectDir, data: indexData })
    )
    return successResult(discovered.assignments.length, warnings, projectDir)
  } catch (caught) {
    return failedResult([operationDiagnostic(caught)], warnings)
  } finally {
    profiler.flush()
    await pool.close()
  }
}

async function collectSnapshotFragments(params: {
  context: ConfigurationContextFromXML
  files: readonly ImportSnapshotFile[]
}): Promise<ConfigurationIndexFragment[]> {
  return Promise.all(
    params.files.map(async (file) => {
      const capability = getMetadataSnapshotImportCapability(file.capabilityId)
      if (capability === undefined) {
        throw new Error(`Не зарегистрирована возможность дополнения снимка: ${file.capabilityId}`)
      }
      return capability.run({
        context: params.context,
        sourcePath: file.sourcePath,
        targetProjectPath: file.targetProjectPath,
      })
    })
  )
}

async function readablePreviousIndex(
  deps: ImportCoordinatorDependencies,
  projectDir: string
): Promise<ConfigurationIndexData | undefined> {
  try {
    return await deps.readIndex({ projectDir, baseId: "default" })
  } catch {
    return undefined
  }
}

function buildImportedConfigurationIndex(params: {
  producerVersion: string
  baseId: string
  indexGeneration: bigint
  projectFiles: readonly ConfigurationProjectFile[]
  fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
}): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration: params.indexGeneration,
      producerVersion: params.producerVersion,
      baseId: params.baseId,
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: params.projectFiles,
    identities: params.fragmentData.identities,
    xmlNodes: params.fragmentData.xmlNodes,
    xmlValues: params.fragmentData.xmlValues,
  }
}

function successResult(
  succeeded: number,
  warnings: ImportDiagnostic[],
  projectDir: string
): ConfigurationImportResult {
  return {
    succeeded,
    failed: [],
    warnings,
    configurationIndexPath: configurationIndexPath(projectDir, "default"),
  }
}

function failedResult(
  failed: ImportDiagnostic[],
  warnings: ImportDiagnostic[]
): ConfigurationImportResult {
  return { succeeded: 0, failed, warnings }
}

function hasErrors(diagnostics: readonly ImportDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error")
}

function operationDiagnostic(caught: unknown): ImportDiagnostic {
  return {
    severity: "error",
    code: "xml_import_operation_failed",
    message: caught instanceof Error ? caught.message : String(caught),
    targetProjectPath: "",
  }
}

function normalizeConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error("Степень параллелизма XML-import должна быть положительным целым числом")
    }
    return value
  }
  return Math.max(1, Math.min(4, availableParallelism() - 1))
}
