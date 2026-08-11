import fs from "node:fs"
import { availableParallelism } from "node:os"
import { join } from "node:path"
import {
  componentPath,
  configurationIndexPath,
  createConfigurationIndexFragmentBuilder,
  hashConfigurationProjectFileList,
  writeConfigurationIndex,
  type ComponentAddress,
  type ConfigurationIndexFragmentBuilder,
  type ConfigurationSnapshot,
  type ConfigurationSnapshotFile,
  type ConfigurationSnapshotFragment,
  type MergedConfigurationSnapshotFragments,
} from "../configurationIndex"
import type { ConfigurationContextFromXML } from "../context/types"
import { createOperationProfiler } from "../validation/profile"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import { createProjectStateFragmentWriter, openProjectStateFragment, type ProjectStateFragment } from "../projectState/binary/fragment"
import {
  createProjectStateService,
  type ProjectStateImportFinalFileStateBatch,
  type ProjectStateImportSession,
  type ProjectStateService,
} from "../projectState"
import { getMetadataSnapshotImportCapability } from "../resourceTopology/adapters/capabilities"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import { createValidationProjectComponent, type ValidationProjectComponent } from "../validation/projectComponents"
import { classifyMetadataProjectPath, projectStateFileBackedTargets } from "../projectDefinition/resources"
import { resolveXmlImportComponent, type XmlImportComponentDescriptor } from "./componentDescriptor"
import { discoverXmlImport, readXmlImportComponentRoot } from "./discovery"
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
  type XmlImportStateSink,
  type XmlImportWorkerPool,
  type XmlImportWorkerPoolHandle,
} from "./workerPool"
import { assertNoPendingPartialXmlSync } from "../partialSyncToXml/pendingStore"

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
  projectState?: ProjectStateService
  createReferenceWorkerPool?: () => PreparedWorkerPool
}

export interface ImportCoordinatorDependencies {
  assertNoPending?(projectDir: string, componentPath: string): void
  createWorkerPool?(params: { concurrency: number }): XmlImportWorkerPool
  discover(params: {
    xmlDir: string
    topology: CompiledMetadataResourceTopology
    rootItemName: string
  }): Promise<{ assignments: ImportAssignment[]; snapshotFiles?: ImportSnapshotFile[] }>
  collectSnapshotFragments?(params: {
    context: ConfigurationContextFromXML
    files: readonly ImportSnapshotFile[]
  }): Promise<ConfigurationSnapshotFragment[]>
  createProjectStateService?(): ProjectStateService
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
  ): Promise<ConfigurationSnapshotFile[]>
  writeIndex(params: { projectDir: string; address: ComponentAddress; data: ConfigurationSnapshot }): Promise<void>
}

const defaultImportDependencies: ImportCoordinatorDependencies = {
  async discover({ xmlDir, topology, rootItemName }) {
    return discoverXmlImport({ xmlDir, topology, rootItemName })
  },
  collectSnapshotFragments,
  createProjectStateService,
  mergeFiles: mergeImportResultFiles,
  transferExternalFiles: transferXmlImportExternalFiles,
  hashProject: hashConfigurationProjectFileList,
  writeIndex: writeConfigurationIndex,
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
  const projectState = params.projectState
    ?? (params.createReferenceWorkerPool === undefined
      ? deps.createProjectStateService?.() ?? createProjectStateService()
      : createProjectStateService({
          createPool: (concurrency) => createPreparedYamlProjectWorkerPool({
            concurrency,
            createWorkerPool: params.createReferenceWorkerPool!,
          }),
        }))
  const ownsProjectState = params.projectState === undefined
  let importSession: ProjectStateImportSession | undefined
  let poolCloseAttempted = false
  let finalized = false
  let outcome: ConfigurationImportResult | undefined
  const importFileHashes = new Map<string, bigint>()
  const temporaryCollections: Array<{ release(): void }> = []

  async function closePoolForCleanup(): Promise<unknown[]> {
    if (pool === undefined || poolCloseAttempted) return []
    poolCloseAttempted = true
    try {
      await pool.close()
      return []
    } catch (caught) {
      return flattenFailures(caught)
    }
  }

  try {
    const root = await readXmlImportComponentRoot(params.inputDir)
    const descriptor = resolveXmlImportComponent(root)
    const resolvedRoot = descriptor.resolveRoot(root)
    const { address } = resolvedRoot
    const selectedComponentPath = componentPath(address)
    const assertNoPending = deps.assertNoPending ?? assertNoPendingPartialXmlSync
    assertNoPending(params.projectDir, selectedComponentPath)
    const validationComponent = createValidationProjectComponent(params.projectDir, address)
    resolvedComponentPath = selectedComponentPath
    assertRequestedComponentPath(params.requestedComponentPath, selectedComponentPath)

    const componentDir = join(params.projectDir, selectedComponentPath)
    await assertComponentPreflight({
      projectDir: params.projectDir,
      componentDir,
      address,
      descriptor,
    })
    await fs.promises.mkdir(params.projectDir, { recursive: true })

    const concurrency = normalizeConcurrency(params.concurrency)
    if (descriptor.baseAddress !== undefined) {
      await projectState.refreshAndValidate({ projectDir: params.projectDir, context: params.context, concurrency })
    }
    importSession = await projectState.beginImport({
      projectDir: params.projectDir,
      workerCount: concurrency,
      output: { componentPaths: [selectedComponentPath] },
      profile: {
        onPhase({ phase, elapsedMs }) {
          profiler.record("Подготовка импорта конфигурации", importStatePhaseName(phase), { timeMs: elapsedMs })
        },
      },
    })
    const fragmentBuilder = createConfigurationIndexFragmentBuilder()
    const stateSink = createImportStateSink(
      importSession,
      importFileHashes,
      selectedComponentPath,
      fragmentBuilder,
    )
    if (params.xmlImportWorkerPoolHandle !== undefined) {
      pool = params.xmlImportWorkerPoolHandle.createOperationPool()
    } else if (deps.createWorkerPool !== undefined) {
      pool = deps.createWorkerPool({ concurrency })
    } else {
      const workerOperation = await projectState.workers.beginOperation({
        id: operationId,
        concurrency,
        context: params.context,
      })
      pool = createXmlImportWorkerPool({ concurrency, operation: workerOperation })
    }

    const discovered = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Поиск XML-файлов выгрузки",
      {},
      () => deps.discover({
        xmlDir: params.inputDir,
        topology: validationComponent.topology,
        rootItemName: resolvedRoot.itemName,
      })
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
          projectDir: params.projectDir,
          componentPath: selectedComponentPath,
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
      () => pool!.runFirstPass(discovered.assignments, stateSink)
    )
    temporaryCollections.push(first.diagnostics, first.files)
    if (first.diagnostics.errors > 0) {
      const firstDiagnostics = [...first.diagnostics]
      const cleanup = await abortCleanupDiagnostics(importSession, firstDiagnostics, closePoolForCleanup)
      return outcome = failedResult([...firstDiagnostics, ...cleanup], [], resolvedComponentPath)
    }
    const snapshotFragments = await (deps.collectSnapshotFragments ?? collectSnapshotFragments)({
      context: params.context,
      files: discovered.snapshotFiles ?? [],
    })
    for (const fragment of snapshotFragments) fragmentBuilder.add(fragment)
    const firstReadToken = await importSession.commitWorkingIndex()
    const readTokens = [firstReadToken]
    for (let index = 1; index < pool.workerCount(); index += 1) readTokens.push(await importSession.createReadToken())
    profiler.record("Подготовка импорта конфигурации", "Распределение индекса метаданных", {
      items: discovered.assignments.length,
      timeMs: 0,
    })
    const second = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Второй проход worker",
      { items: discovered.assignments.length },
      () => pool!.runSecondPass(readTokens, stateSink)
    )
    temporaryCollections.push(second.diagnostics, second.warnings, second.files)
    warnings = [...second.warnings]
    if (second.diagnostics.errors > 0) {
      const secondDiagnostics = [...second.diagnostics]
      const cleanup = await abortCleanupDiagnostics(importSession, secondDiagnostics, closePoolForCleanup)
      return outcome = failedResult([...secondDiagnostics, ...cleanup], warnings, resolvedComponentPath)
    }
    const fragmentData = fragmentBuilder.finish()
    profiler.record("Подготовка импорта конфигурации", "Обобщение фрагментов данных файла индекса конфигурации", {
      items: discovered.assignments.length,
      timeMs: 0,
    })

    const allFiles = [...first.files, ...second.files]
    const files = profiler.measure(
      "Подготовка импорта конфигурации",
      "Обобщение списка файлов результата импорта",
      { items: allFiles.length },
      () => deps.mergeFiles(allFiles)
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
          ...(params.copyExternalConcurrency === undefined ? {} : { concurrency: params.copyExternalConcurrency }),
        })
    )
    const xmlFiles = files.filter(({ sourceKind }) => sourceKind === "xml")
    const externalProjectFiles = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Вычисление хэшей файлов проекта",
      {},
      () =>
        deps.hashProject(
          componentDir,
          xmlFiles.map((file) => file.targetProjectPath),
          {
            ...(params.hashConcurrency === undefined ? {} : { concurrency: params.hashConcurrency }),
          }
        )
    )
    const externalFinalState = externalFileStateBatch(validationComponent, externalProjectFiles)
    if (externalFinalState.updates.length > 0) {
      rememberImportFileHashes(importFileHashes, selectedComponentPath, externalFinalState)
      const externalWriter = createProjectStateFragmentWriter()
      externalWriter.appendImportFinal(externalFinalState)
      await importSession.writeStateFragment(externalWriter.finish())
    }
    const projectFiles = snapshotFilesFromState(files, importFileHashes)
    const indexData = profiler.measure(
      "Подготовка импорта конфигурации",
      "Формирование данных файла индекса конфигурации",
      { items: projectFiles.length },
      () =>
        buildImportedConfigurationSnapshot({
          componentPath: selectedComponentPath,
          projectFiles,
          fragmentData,
        })
    )
    const stateResult = await importSession.finalize(() =>
      profiler.measureAsync(
        "Подготовка импорта конфигурации",
        "Запись файла индекса конфигурации",
        { items: projectFiles.length },
        () => deps.writeIndex({ projectDir: params.projectDir, address, data: indexData })
      )
    )
    finalized = true
    const validationFailures = [...stateResult.diagnostics].map((diagnostic) => ({
      severity: diagnostic.severity,
      code: "project_validation",
      message: diagnostic.message,
      targetProjectPath: diagnostic.filePath,
    } satisfies ImportDiagnostic))
    stateResult.diagnostics.release()
    return outcome = {
      ...successResult(discovered.assignments.length, warnings, params.projectDir, address),
      failed: validationFailures.filter(({ severity }) => severity === "error"),
      warnings: [...warnings, ...validationFailures.filter(({ severity }) => severity === "warning")],
    }
  } catch (caught) {
    const cleanup = importSession === undefined || finalized
      ? []
      : await abortCleanupDiagnostics(importSession, caught, closePoolForCleanup)
    return outcome = failedResult(
      [...flattenFailures(caught).map(operationDiagnostic), ...cleanup],
      warnings,
      resolvedComponentPath,
    )
  } finally {
    for (const collection of temporaryCollections) collection.release()
    profiler.flush()
    const cleanupFailures = await closePoolForCleanup()
    if (ownsProjectState) {
      try {
        await projectState.close()
      } catch (caught) {
        cleanupFailures.push(...flattenFailures(caught))
      }
    }
    if (!finalized && outcome !== undefined) {
      outcome.failed.push(...cleanupFailures.map(operationDiagnostic))
    }
  }
}

function importStatePhaseName(
  phase: import("../projectState/importSession").ProjectStateImportProfilePhase,
): string {
  return {
    workingIndex: "Фиксация рабочего индекса",
    finalBuild: "Построение окончательного состояния",
    dependencyValidation: "Полная проверка зависимостей",
    save: "Сохранение состояния проекта",
    publication: "Публикация состояния проекта",
  }[phase]
}

async function abortCleanupDiagnostics(
  session: ProjectStateImportSession,
  primary: unknown,
  closePool: () => Promise<unknown[]>,
): Promise<ImportDiagnostic[]> {
  const failures = await closePool()
  try {
    await session.abort(primary)
  } catch (caught) {
    const primaryFailures = flattenFailures(primary)
    failures.push(...flattenFailures(caught).filter((failure) => !primaryFailures.includes(failure)))
  }
  return failures.map(operationDiagnostic)
}

function flattenFailures(caught: unknown): unknown[] {
  return caught instanceof AggregateError
    ? caught.errors.flatMap((failure) => flattenFailures(failure))
    : [caught]
}

function createImportStateSink(
  session: ProjectStateImportSession,
  hashes: Map<string, bigint>,
  selectedComponentPath: string,
  fragmentBuilder: ConfigurationIndexFragmentBuilder,
): XmlImportStateSink {
  const writeState = async (batch: Parameters<XmlImportStateSink["writeFirstPassState"]>[0]): Promise<void> => {
    if (batch.configurationFragment !== undefined) fragmentBuilder.add(batch.configurationFragment)
    if (batch.configurationFragmentBuffer !== undefined) fragmentBuilder.addEncoded(batch.configurationFragmentBuffer)
    if (batch.stateFragment !== undefined) {
      await writeStreamedImportState(session, hashes, selectedComponentPath, batch.stateFragment)
    }
  }
  return {
    writeFirstPassState: writeState,
    writeSecondPassState: writeState,
  }
}

async function writeStreamedImportState(
  session: ProjectStateImportSession,
  hashes: Map<string, bigint>,
  selectedComponentPath: string,
  fragment: ProjectStateFragment,
): Promise<void> {
  const view = openProjectStateFragment(fragment)
  for (let fileId = 0; fileId < view.fileCount; fileId += 1) {
    const file = view.fileRecord(fileId)
    if (view.stringValue(file.componentPathId) === selectedComponentPath && file.hash !== 0n) {
      const projectPath = view.stringValue(file.projectPathId)
      const prefix = `${selectedComponentPath}/`
      if (!projectPath.startsWith(prefix)) throw new Error(`Файл состояния вне компонента: ${projectPath}`)
      hashes.set(projectPath.slice(prefix.length), file.hash)
    }
  }
  await session.writeStateFragment(fragment)
}

async function collectSnapshotFragments(params: {
  context: ConfigurationContextFromXML
  files: readonly ImportSnapshotFile[]
}): Promise<ConfigurationSnapshotFragment[]> {
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

function assertRequestedComponentPath(requestedComponentPath: string | undefined, detectedComponentPath: string): void {
  if (requestedComponentPath !== undefined && requestedComponentPath !== detectedComponentPath) {
    throw new Error(
      `Запрошенный путь компонента ${requestedComponentPath} не совпадает с обнаруженным ${detectedComponentPath}`
    )
  }
}

function buildImportedConfigurationSnapshot(params: {
  componentPath: string
  projectFiles: readonly ConfigurationSnapshotFile[]
  fragmentData: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshot {
  return {
    specificationVersion: "1.4",
    indexGeneration: 1n,
    componentPath: params.componentPath,
    files: params.projectFiles,
    entities: params.fragmentData.entities,
  }
}

export function externalFileStateBatch(
  component: ValidationProjectComponent,
  files: readonly ConfigurationSnapshotFile[],
): ProjectStateImportFinalFileStateBatch {
  const entries = files.map((file) => {
    const resource = classifyMetadataProjectPath(file.projectPath, component)
    if (resource === undefined) throw new Error(`Переданный файл не принадлежит топологии: ${file.projectPath}`)
    return {
      update: {
        kind: "resource" as const,
        projectPath: `${component.componentPath}/${file.projectPath}`,
        componentPath: component.componentPath,
        resourceKind: "resource" as const,
        targets: projectStateFileBackedTargets(component.componentPath, resource.fileBackedTargets),
      },
      hash: file.contentHash,
    }
  })
  const batch = createProjectStateFileUpdateBatch(entries)
  return { updates: entries.map(({ update }) => update), hashBytes: batch.hashBytes }
}

function rememberImportFileHashes(
  hashes: Map<string, bigint>,
  selectedComponentPath: string,
  batch: ProjectStateImportFinalFileStateBatch,
): void {
  const view = new DataView(batch.hashBytes.buffer, batch.hashBytes.byteOffset, batch.hashBytes.byteLength)
  batch.updates.forEach((update, index) => {
    const prefix = `${selectedComponentPath}/`
    if (!update.projectPath.startsWith(prefix)) throw new Error(`Файл состояния вне компонента: ${update.projectPath}`)
    hashes.set(update.projectPath.slice(prefix.length), view.getBigUint64(index * 8, false))
  })
}

function snapshotFilesFromState(
  files: readonly ImportResultFile[],
  hashes: ReadonlyMap<string, bigint>,
): ConfigurationSnapshotFile[] {
  return files.map(({ targetProjectPath }) => {
    const contentHash = hashes.get(targetProjectPath)
    if (contentHash === undefined) throw new Error(`Import не передал хэш готового файла: ${targetProjectPath}`)
    return { projectPath: targetProjectPath, contentHash }
  })
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
    ...(resolvedComponentPath === undefined ? {} : { componentPath: resolvedComponentPath }),
    succeeded: 0,
    failed,
    warnings,
  }
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
