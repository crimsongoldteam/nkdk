import fs from "node:fs"
import { availableParallelism } from "node:os"
import { join } from "node:path"
import { NKDK_CORE_VERSION } from "../../version"
import {
  componentPath,
  configurationIndexPath,
  encodeConfigurationIndexFragments,
  hashConfigurationProjectFileList,
  mergeConfigurationIndexFragments,
  writeConfigurationIndexAtomically,
  type ComponentAddress,
  type ConfigurationIndexData,
  type ConfigurationProjectFile,
  type ConfigurationIndexFragment,
} from "../configurationIndex"
import type { ConfigurationContextFromXML } from "../context/types"
import type { PreparedWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { serializeSharedValidationSnapshot } from "../validation/persistedSharedValidationSnapshot"
import { createOperationProfiler } from "../validation/profile"
import type { ValidationIndexContribution } from "../validation/projectValidationTypes"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type { ConfigurationLocalDependency } from "../configurationIndex/types"
import { getMetadataSnapshotImportCapability } from "../resourceTopology/capabilities"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import {
  buildComponentReferenceSnapshot,
  createLayeredImportReferenceSnapshot,
} from "./componentReferenceIndex"
import {
  resolveXmlImportComponent,
  type XmlImportComponentDescriptor,
} from "./componentDescriptor"
import {
  discoverXmlImport,
  readXmlImportComponentRoot,
} from "./discovery"
import { createImportSharedValidationSnapshot } from "./metadataSnapshot"
import { mergeImportResultFiles, transferXmlImportExternalFiles } from "./transfer"
import type {
  ExternalFileTransfer,
  ImportAssignment,
  ImportDiagnostic,
  ImportResultFile,
  ImportSnapshotFile,
} from "./types"
import {
  createXmlImportWorkerPool,
  type XmlImportWorkerPool,
  type XmlImportWorkerPoolHandle,
} from "./workerPool"

export interface ConfigurationImportResult {
  componentPath?: string
  succeeded: number
  failed: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  configurationIndexPath?: string
}

export interface ImportConfigurationFromXmlParams {
  context: ConfigurationContextFromXML
  inputDir: string
  projectDir: string
  requestedComponentPath?: string
  concurrency?: number
  copyExternalConcurrency?: number
  externalFileTransfer?: ExternalFileTransfer
  hashConcurrency?: number
  operationId?: string
  xmlImportWorkerPoolHandle?: XmlImportWorkerPoolHandle
  createReferenceWorkerPool?: () => PreparedWorkerPool
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
  createSharedMetadata(contribution: ValidationIndexContribution): SharedValidationSnapshot
  buildComponentReferenceSnapshot(params: {
    componentDir: string
    context: ConfigurationContextFromXML
    concurrency: number
  }): Promise<SharedValidationSnapshot>
  mergeFiles(files: readonly ImportResultFile[]): ImportResultFile[]
  transferExternalFiles(params: {
    projectDir: string
    files: readonly ImportResultFile[]
    concurrency?: number
    transfer: ExternalFileTransfer
  }): Promise<void>
  hashProject(
    projectDir: string,
    projectPaths: readonly string[],
    options: { concurrency?: number }
  ): Promise<ConfigurationProjectFile[]>
  writeIndex(params: {
    projectDir: string
    address: ComponentAddress
    data: ConfigurationIndexData
  }): Promise<void>
}

const defaultImportDependencies: ImportCoordinatorDependencies = {
  createWorkerPool: createXmlImportWorkerPool,
  async discover({ xmlDir }) {
    return discoverXmlImport({ xmlDir, topology: compileRegisteredMetadataResourceTopology() })
  },
  collectSnapshotFragments,
  createSharedMetadata: createImportSharedValidationSnapshot,
  buildComponentReferenceSnapshot,
  mergeFiles: mergeImportResultFiles,
  transferExternalFiles: transferXmlImportExternalFiles,
  hashProject: hashConfigurationProjectFileList,
  writeIndex: writeConfigurationIndexAtomically,
}

export async function importConfigurationFromXml(
  params: ImportConfigurationFromXmlParams,
  deps: ImportCoordinatorDependencies = defaultImportDependencies
): Promise<ConfigurationImportResult> {
  const operationId = params.operationId ?? "direct-write"
  const profiler = createOperationProfiler({ operation: "import-from-xml", scope: { scope: "main" } })
  let pool: XmlImportWorkerPool | undefined
  let warnings: ImportDiagnostic[] = []
  let resolvedComponentPath: string | undefined

  try {
    const root = await readXmlImportComponentRoot(params.inputDir)
    const descriptor = resolveXmlImportComponent(root)
    const address = descriptor.resolveAddress(root)
    const selectedComponentPath = componentPath(address)
    resolvedComponentPath = selectedComponentPath
    assertRequestedComponentPath(params.requestedComponentPath, selectedComponentPath)

    const componentDir = join(params.projectDir, selectedComponentPath)
    await assertComponentPreflight({
      projectDir: params.projectDir,
      componentDir,
      address,
      descriptor,
    })

    const concurrency = normalizeConcurrency(params.concurrency)
    const baseSnapshot = await buildBaseSnapshot({
      deps,
      descriptor,
      projectDir: params.projectDir,
      context: params.context,
      concurrency,
      createReferenceWorkerPool: params.createReferenceWorkerPool,
      profiler,
    })
    pool =
      params.xmlImportWorkerPoolHandle?.createOperationPool() ??
      deps.createWorkerPool({ concurrency })

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
    await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Инициализация worker",
      { items: discovered.assignments.length },
      () =>
        pool!.initialize({
          operationId,
          context: params.context,
          outputDir: componentDir,
          componentKind: descriptor.kind,
          ...(descriptor.metadataItemAugmenter === undefined
            ? {}
            : { metadataItemAugmenter: descriptor.metadataItemAugmenter }),
        })
    )
    const first = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Первый проход worker",
      { items: discovered.assignments.length },
      () => pool!.runFirstPass(discovered.assignments)
    )
    if (hasErrors(first.diagnostics)) {
      return failedResult(first.diagnostics, [], resolvedComponentPath)
    }
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
    const localSnapshot = profiler.measure(
      "Подготовка импорта конфигурации",
      "Обобщение индекса метаданных",
      { items: first.validationContribution.objectRecords.length },
      () => deps.createSharedMetadata(first.validationContribution)
    )
    const referenceSnapshots = createLayeredImportReferenceSnapshot({
      local: localSnapshot,
      ...(baseSnapshot === undefined ? {} : { base: baseSnapshot }),
    })
    profiler.record("Подготовка импорта конфигурации", "Распределение индекса метаданных", {
      items: discovered.assignments.length,
      timeMs: 0,
    })
    const second = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Второй проход worker",
      { items: discovered.assignments.length },
      () => pool!.runSecondPass(referenceSnapshots)
    )
    warnings = second.warnings
    if (hasErrors(second.diagnostics)) {
      return failedResult(second.diagnostics, warnings, resolvedComponentPath)
    }

    const files = profiler.measure(
      "Подготовка импорта конфигурации",
      "Обобщение списка файлов результата импорта",
      { items: second.files.length },
      () => deps.mergeFiles(second.files)
    )
    await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Копирование внешних файлов XML-выгрузки",
      { items: files.length },
      () =>
        deps.transferExternalFiles({
          projectDir: componentDir,
          files,
          transfer: params.externalFileTransfer ?? "copy",
          ...(params.copyExternalConcurrency === undefined
            ? {}
            : { concurrency: params.copyExternalConcurrency }),
        })
    )
    const projectFiles = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Вычисление хэшей файлов проекта",
      {},
      () =>
        deps.hashProject(
          componentDir,
          files.map((file) => file.targetProjectPath),
          {
            ...(params.hashConcurrency === undefined
              ? {}
              : { concurrency: params.hashConcurrency }),
          }
        )
    )
    const indexData = profiler.measure(
      "Подготовка импорта конфигурации",
      "Формирование данных файла индекса конфигурации",
      { items: projectFiles.length },
      () =>
        buildImportedConfigurationIndex({
          producerVersion: NKDK_CORE_VERSION,
          componentPath: selectedComponentPath,
          projectFiles,
          fragmentData,
          localSnapshot,
          localDependencies: fragmentData.localDependencies,
        })
    )
    await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Запись файла индекса конфигурации",
      { items: projectFiles.length },
      () => deps.writeIndex({ projectDir: params.projectDir, address, data: indexData })
    )
    return successResult(
      discovered.assignments.length,
      warnings,
      params.projectDir,
      address
    )
  } catch (caught) {
    return failedResult(
      [operationDiagnostic(caught)],
      warnings,
      resolvedComponentPath
    )
  } finally {
    profiler.flush()
    await pool?.close()
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

async function buildBaseSnapshot(params: {
  deps: ImportCoordinatorDependencies
  descriptor: XmlImportComponentDescriptor
  projectDir: string
  context: ConfigurationContextFromXML
  concurrency: number
  createReferenceWorkerPool?: () => PreparedWorkerPool
  profiler: ReturnType<typeof createOperationProfiler>
}): Promise<SharedValidationSnapshot | undefined> {
  const baseAddress = params.descriptor.baseAddress
  if (baseAddress === undefined) return undefined
  return params.profiler.measureAsync(
    "Подготовка импорта конфигурации",
    "Холодное построение индекса базового компонента",
    {},
    () =>
      params.deps.buildComponentReferenceSnapshot({
        componentDir: join(params.projectDir, componentPath(baseAddress)),
        context: params.context,
        concurrency: params.concurrency,
        ...(params.createReferenceWorkerPool === undefined
          ? {}
          : { createWorkerPool: params.createReferenceWorkerPool }),
      })
  )
}

async function assertComponentPreflight(params: {
  projectDir: string
  componentDir: string
  address: ComponentAddress
  descriptor: XmlImportComponentDescriptor
}): Promise<void> {
  if (params.descriptor.baseAddress !== undefined) {
    const basePath = componentPath(params.descriptor.baseAddress)
    const baseDir = join(params.projectDir, basePath)
    const base = await statIfExists(baseDir)
    if (base === undefined || !base.isDirectory()) {
      throw new Error(`Не найден базовый компонент ${basePath}`)
    }
  }

  const target = await statIfExists(params.componentDir)
  if (target !== undefined) {
    if (!target.isDirectory()) {
      throw new Error(`Целевой компонент не является каталогом: ${componentPath(params.address)}`)
    }
    const entries = await fs.promises.readdir(params.componentDir)
    if (entries.length > 0) {
      throw new Error(`Целевой каталог компонента не пуст: ${componentPath(params.address)}`)
    }
  }

  const snapshotPath = configurationIndexPath(params.projectDir, params.address)
  if ((await statIfExists(snapshotPath)) !== undefined) {
    throw new Error(`Снимок компонента уже существует: ${componentPath(params.address)}`)
  }
}

async function statIfExists(path: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.stat(path)
  } catch (caught) {
    if (isNodeError(caught) && caught.code === "ENOENT") return undefined
    throw caught
  }
}

function isNodeError(caught: unknown): caught is NodeJS.ErrnoException {
  return caught instanceof Error && "code" in caught
}

function assertRequestedComponentPath(
  requestedComponentPath: string | undefined,
  detectedComponentPath: string
): void {
  if (
    requestedComponentPath !== undefined &&
    requestedComponentPath !== detectedComponentPath
  ) {
    throw new Error(
      `Запрошенный путь компонента ${requestedComponentPath} не совпадает с обнаруженным ${detectedComponentPath}`
    )
  }
}

function buildImportedConfigurationIndex(params: {
  producerVersion: string
  componentPath: string
  projectFiles: readonly ConfigurationProjectFile[]
  fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues"> & {
    localDependencies: readonly ConfigurationLocalDependency[]
  }
  localSnapshot: SharedValidationSnapshot
  localDependencies: readonly ConfigurationLocalDependency[]
}): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration: 1n,
      producerVersion: params.producerVersion,
      componentPath: params.componentPath,
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: params.projectFiles,
    identities: params.fragmentData.identities,
    xmlNodes: params.fragmentData.xmlNodes,
    xmlValues: params.fragmentData.xmlValues,
    localIndexes: {
      metadata: serializeSharedValidationSnapshot(params.localSnapshot),
      dependencies: params.localDependencies,
      logicalAddresses: uniqueLogicalAddresses(
        params.fragmentData.identities,
        params.projectFiles[0]?.projectPath
      ),
    },
  }
}

function uniqueLogicalAddresses(
  identities: ConfigurationIndexData["identities"],
  sourceProjectPath: string | undefined
): ConfigurationIndexData["localIndexes"]["logicalAddresses"] {
  if (sourceProjectPath === undefined) return []
  return [...new Set(identities.map(({ logicalAddress }) => logicalAddress))].map(
    (logicalAddress) => ({ logicalAddress, sourceProjectPath })
  )
}

function successResult(
  succeeded: number,
  warnings: ImportDiagnostic[],
  projectDir: string,
  address: ComponentAddress
): ConfigurationImportResult {
  return {
    componentPath: componentPath(address),
    succeeded,
    failed: [],
    warnings,
    configurationIndexPath: configurationIndexPath(projectDir, address),
  }
}

function failedResult(
  failed: ImportDiagnostic[],
  warnings: ImportDiagnostic[],
  resolvedComponentPath?: string
): ConfigurationImportResult {
  return {
    ...(resolvedComponentPath === undefined
      ? {}
      : { componentPath: resolvedComponentPath }),
    succeeded: 0,
    failed,
    warnings,
  }
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
