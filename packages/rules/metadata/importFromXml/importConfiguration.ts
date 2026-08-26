import fs from "node:fs"
import { availableParallelism, totalmem } from "node:os"
import { join } from "node:path"
import { constrainedMemory } from "node:process"
import {
  componentPath,
  configurationIndexStoreDescriptor,
  decodeConfigurationBlockFragments,
  hashConfigurationProjectFileList,
  type ComponentAddress,
  type ConfigurationProjectFile,
  type ConfigurationIndexBlockFragment,
} from "../configurationIndex"
import type { ConfigurationIndexCandidateStore } from "../configurationIndex/store"
import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import { createOperationProfiler } from "../validation/profile"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import {
  createProjectStateService,
  type ProjectStateImportFinalFileStateBatch,
  type ProjectStateImportSession,
  type ProjectStateService,
} from "../projectState"
import { getMetadataSnapshotImportCapability } from "../resourceTopology/adapters/capabilities"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import {
  loadConfigurationLanguagesFromXML,
  loadConfigurationLanguagesFromYAML,
} from "../context/configurationLanguages"
import { configurationValidationContextVersions } from "../context/validationContextVersions"
import { createValidationProjectComponent, type ValidationProjectComponent } from "../validation/projectComponents"
import { classifyMetadataProjectPath, projectStateFileBackedTargets } from "../projectDefinition/resources"
import { resolveXmlImportComponent, type XmlImportComponentDescriptor } from "./componentDescriptor"
import { discoverXmlImport, readXmlImportComponentRoot } from "./discovery"
import { mergeImportResultFiles, transferXmlImportExternalFiles } from "./transfer"
import type {
  ExternalFileTransfer,
  ImportAssignment,
  ImportDiagnostic,
  ImportExternalFile,
  ImportResultFile,
  ImportSnapshotFile,
} from "./types"
import {
  createXmlImportWorkerPool,
  type XmlImportStateSink,
  type XmlImportWorkerPool,
  type XmlImportWorkerPoolHandle,
} from "./workerPool"
import { classifyImportedIssues } from "./classifyImportedIssues"
import type { ImportProjectIssueDecision } from "../workerPool/importContracts"
import type { PreparedImportStore } from "../projectState/preparedImportStore"
import { prepareImportXmlReconstructionProfile } from "./reconstructionProfile"
import { configurationExtensionTypeDescriptionXMLNameByType } from "../appliedObjects/configurationExtension/typeDescriptionPolicy"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"
import { restorePreparedImportRecord } from "./preparedRecord"

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
  resolveComponent?(root: Record<string, unknown>): XmlImportComponentDescriptor
  assertNoPending?(projectDir: string, componentPath: string): void | Promise<void>
  createWorkerPool?(params: { concurrency: number }): XmlImportWorkerPool
  loadLanguagesFromXML?(xmlDir: string): ReturnType<typeof loadConfigurationLanguagesFromXML>
  loadLanguagesFromYAML?(configurationDir: string): ReturnType<typeof loadConfigurationLanguagesFromYAML>
  discover(params: {
    xmlDir: string
    topology: CompiledMetadataResourceTopology
    rootItemName: string
  }): Promise<{ assignments: ImportAssignment[]; snapshotFiles?: ImportSnapshotFile[] }>
  collectSnapshotFragments?(params: {
    context: ConfigurationContextFromXML
    files: readonly ImportSnapshotFile[]
  }): Promise<ConfigurationIndexBlockFragment[]>
  createIndexCandidate?: CreateConfigurationIndexCandidate
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
  ): Promise<ConfigurationProjectFile[]>
  publishCandidate?(params: {
    readonly projectDir: string
    readonly address: ComponentAddress
    readonly candidate: ConfigurationIndexCandidateStore
  }): Promise<void>
  prepareReconstructionProfile?: typeof prepareImportXmlReconstructionProfile
  readPreparedRootYaml?(params: {
    readonly preparedStore: PreparedImportStore
    readonly rootAssignment: ImportAssignment
  }): Promise<unknown>
}

const defaultImportDependencies: ImportCoordinatorDependencies = {
  resolveComponent: resolveXmlImportComponent,
  async discover({ xmlDir, topology, rootItemName }) {
    return discoverXmlImport({ xmlDir, topology, rootItemName })
  },
  collectSnapshotFragments,
  createProjectStateService,
  mergeFiles: mergeImportResultFiles,
  transferExternalFiles: transferXmlImportExternalFiles,
  hashProject: hashConfigurationProjectFileList,
  async publishCandidate({ projectDir, address, candidate }) {
    const { configurationIndexStoreDescriptor, openConfigurationIndexStore } = await import("../configurationIndex/store")
    const active = openConfigurationIndexStore(configurationIndexStoreDescriptor(projectDir, address), "readWrite")
    await active.publishImportedCandidate(candidate)
  },
}

type CreateConfigurationIndexCandidate = (params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly operationId: string
  readonly purpose: "import" | "full" | "partial"
}) => Promise<ConfigurationIndexCandidateStore>

async function createDefaultConfigurationIndexCandidate(
  params: Parameters<CreateConfigurationIndexCandidate>[0],
): Promise<ConfigurationIndexCandidateStore> {
  const { createConfigurationIndexCandidateStore } = await import("../configurationIndex/store")
  return createConfigurationIndexCandidateStore(params)
}

async function assertNoPendingDefault(projectDir: string, selectedComponentPath: string): Promise<void> {
  const { assertNoPendingPartialXmlSync } = await import("../partialSyncToXml/pendingStore")
  await assertNoPendingPartialXmlSync(projectDir, selectedComponentPath)
}

export function createImportCoordinatorDependencies(
  resolveComponent: NonNullable<ImportCoordinatorDependencies["resolveComponent"]>,
): ImportCoordinatorDependencies {
  return { ...defaultImportDependencies, resolveComponent }
}

async function readPreparedRootYaml(params: {
  readonly preparedStore: PreparedImportStore
  readonly rootAssignment: ImportAssignment
}): Promise<unknown> {
  return restorePreparedImportRecord(
    await params.preparedStore.read(params.rootAssignment.id),
  ).yaml
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
  let indexCandidate: ConfigurationIndexCandidateStore | undefined
  let poolCloseAttempted = false
  let finalized = false
  let outcome: ConfigurationImportResult | undefined
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
    const descriptor = (deps.resolveComponent ?? resolveXmlImportComponent)(root)
    const resolvedRoot = descriptor.resolveRoot(root)
    const { address } = resolvedRoot
    const selectedComponentPath = componentPath(address)
    const assertNoPending = deps.assertNoPending ?? assertNoPendingDefault
    await assertNoPending(params.projectDir, selectedComponentPath)
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

    const languages = descriptor.baseAddress === undefined
      ? await (deps.loadLanguagesFromXML ?? loadConfigurationLanguagesFromXML)(params.inputDir)
      : await (deps.loadLanguagesFromYAML ?? loadConfigurationLanguagesFromYAML)(join(params.projectDir, "cf"))
    const operationContext = { ...params.context, languages }
    const importContext = descriptor.metadataItemAugmenter === "configurationExtension"
      ? withPropertyStateCompatibilityMode(operationContext, root)
      : operationContext

    const concurrency = normalizeConcurrency(params.concurrency)
    if (descriptor.baseAddress !== undefined) {
      await projectState.refreshAndValidate({
        projectDir: params.projectDir,
        context: operationContext,
        validationContextVersions: configurationValidationContextVersions(operationContext),
        concurrency,
      })
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
    indexCandidate = await (deps.createIndexCandidate ?? createDefaultConfigurationIndexCandidate)({
      projectDir: params.projectDir,
      address,
      operationId,
      purpose: "import",
    })
    const preparedStore = await importSession.preparedImportStore()
    const stateSink = createImportStateSink(
      importSession,
      indexCandidate,
      preparedStore,
    )
    const configurationIndexDescriptor = indexCandidate.descriptor()
    if (params.xmlImportWorkerPoolHandle !== undefined) {
      pool = params.xmlImportWorkerPoolHandle.createOperationPool()
    } else if (deps.createWorkerPool !== undefined) {
      pool = deps.createWorkerPool({ concurrency })
    } else {
      const workerOperation = await projectState.workers.beginOperation({
        id: operationId,
        concurrency,
        context: importContext,
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
          context: importContext,
          outputDir: componentDir,
          projectDir: params.projectDir,
          componentPath: selectedComponentPath,
          componentKind: descriptor.kind,
          ...(descriptor.metadataItemAugmenter === undefined
            ? {}
            : { metadataItemAugmenter: descriptor.metadataItemAugmenter }),
          preparedStore: preparedStore.descriptor(),
          configurationIndex: configurationIndexDescriptor,
          ...(address.kind === "configurationExtension"
            ? {
                baseConfigurationIndex: configurationIndexStoreDescriptor(
                  params.projectDir,
                  { kind: "configuration" },
                ),
              }
            : {}),
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
      context: operationContext,
      files: discovered.snapshotFiles ?? [],
    })
    if (snapshotFragments.length > 0) indexCandidate.mergeBlockFragments(snapshotFragments)
    const firstReadToken = await importSession.commitWorkingIndex()
    const reconstructionProfile = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Подготовка профиля восстановления XML компонента",
      { items: discovered.assignments.length },
      () => (deps.prepareReconstructionProfile ?? prepareImportXmlReconstructionProfile)({
        address,
        projectDir: params.projectDir,
        assignments: discovered.assignments,
        projectState,
        projectStateReadToken: firstReadToken,
        targetIndex: indexCandidate!,
      }),
    )
    const rootAssignments = discovered.assignments.filter(({ role }) => role === "configuration")
    if (rootAssignments.length !== 1) {
      throw new Error(`Ожидалось одно корневое задание XML-import, получено: ${rootAssignments.length}`)
    }
    const rootYaml = await (deps.readPreparedRootYaml ?? readPreparedRootYaml)({
      preparedStore,
      rootAssignment: rootAssignments[0]!,
    })
    const exportProfile: XmlComponentExportProfile = {
      ...reconstructionProfile,
      ...(address.kind !== "configurationExtension"
        ? {}
        : {
            typeDescriptionXMLNameByType:
              configurationExtensionTypeDescriptionXMLNameByType(rootYaml),
          }),
    }
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
      () => pool!.runSecondPass(readTokens, exportProfile, stateSink)
    )
    temporaryCollections.push(second.diagnostics, second.warnings, second.files)
    warnings = [...second.warnings]
    if (second.diagnostics.errors > 0) {
      const secondDiagnostics = [...second.diagnostics]
      const cleanup = await abortCleanupDiagnostics(importSession, secondDiagnostics, closePoolForCleanup)
      return outcome = failedResult([...secondDiagnostics, ...cleanup], warnings, resolvedComponentPath)
    }
    const externalSemanticState = externalFileSemanticStateBatch(
      validationComponent,
      discovered.assignments.flatMap(({ externalFiles }) => externalFiles),
    )
    if (externalSemanticState.updates.length > 0) {
      const externalWriter = createProjectStateFragmentWriter()
      externalWriter.appendImportFinal(externalSemanticState)
      await importSession.writeStateFragment(externalWriter.finish())
    }
    const semanticReadToken = await importSession.commitSemanticIndex()
    const semanticIssues = await importSession.collectSemanticValidationIssues()
    const semanticClassification = classifySemanticImportIssues(semanticIssues)
    if (semanticClassification.fatal.length > 0) {
      const diagnostics = semanticClassification.fatal.map(({ projectPath, code }) => ({
        severity: "error" as const,
        code: "xml_import_validation_failed",
        message: `Не удалось классифицировать ошибку смыслового индекса: ${code}`,
        targetProjectPath: projectPath,
      }))
      const cleanup = await abortCleanupDiagnostics(importSession, diagnostics, closePoolForCleanup)
      return outcome = failedResult([...diagnostics, ...cleanup], warnings, resolvedComponentPath)
    }
    const semanticReadTokens = [semanticReadToken]
    for (let index = 1; index < pool.workerCount(); index += 1) {
      semanticReadTokens.push(await importSession.createReadToken())
    }
    const third = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Третий проход worker",
      { items: discovered.assignments.length },
      () => pool!.runThirdPass(semanticReadTokens, stateSink, semanticClassification.decisions),
    )
    temporaryCollections.push(third.diagnostics, third.warnings, third.files)
    warnings = [...warnings, ...third.warnings]
    if (third.diagnostics.errors > 0) {
      const thirdDiagnostics = [...third.diagnostics]
      const cleanup = await abortCleanupDiagnostics(importSession, thirdDiagnostics, closePoolForCleanup)
      return outcome = failedResult([...thirdDiagnostics, ...cleanup], warnings, resolvedComponentPath)
    }
    const allFiles = [...first.files, ...second.files, ...third.files]
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
    const projectFiles = await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Вычисление хэшей файлов проекта",
      {},
      () =>
        deps.hashProject(
          componentDir,
          files.map((file) => file.targetProjectPath),
          {
            ...(params.hashConcurrency === undefined ? {} : { concurrency: params.hashConcurrency }),
          }
        )
    )
    const externalPaths = new Set(
      files
        .filter(({ sourceKind }) => sourceKind === "xml")
        .map(({ targetProjectPath }) => targetProjectPath)
    )
    const externalProjectFiles = projectFiles.filter(({ projectPath }) => externalPaths.has(projectPath))
    const externalFinalState = externalFileStateBatch(validationComponent, externalProjectFiles)
    if (externalFinalState.updates.length > 0) {
      const externalWriter = createProjectStateFragmentWriter()
      externalWriter.appendImportFinal(externalFinalState)
      await importSession.writeStateFragment(externalWriter.finish())
    }
    await importSession.replaceFinalHashes(projectFiles.map((file) => ({
      projectPath: `${validationComponent.componentPath}/${file.projectPath}`,
      hash: file.contentHash,
    })))
    indexCandidate.replaceHashes(projectFiles)
    indexCandidate.validateCandidate()
    const candidateToPublish = indexCandidate
    const stateResult = await importSession.finalize(() => profiler.measureAsync(
        "Подготовка импорта конфигурации",
        "Запись файла индекса конфигурации",
        { items: projectFiles.length },
        async () => {
          await (deps.publishCandidate ?? defaultImportDependencies.publishCandidate!)({
            projectDir: params.projectDir,
            address,
            candidate: candidateToPublish,
          })
        },
      ))
    indexCandidate = undefined
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
    if (indexCandidate !== undefined) {
      try {
        await indexCandidate.discard()
      } catch (caught) {
        if (outcome !== undefined) outcome.failed.push(...flattenFailures(caught).map(operationDiagnostic))
      }
    }
  }
}

function classifySemanticImportIssues(
  entries: readonly import("../projectState/importSession").ProjectStateImportValidationIssue[],
): {
  readonly decisions: readonly ImportProjectIssueDecision[]
  readonly fatal: readonly { readonly projectPath: string; readonly code: string }[]
} {
  const byProjectPath = new Map<string, import("@nkdk/runtime").ValidationIssue[]>()
  for (const { projectPath, issue } of entries) {
    const issues = byProjectPath.get(projectPath) ?? []
    issues.push(issue)
    byProjectPath.set(projectPath, issues)
  }
  const decisions: ImportProjectIssueDecision[] = []
  const fatal: { projectPath: string; code: string }[] = []
  for (const [projectPath, issues] of byProjectPath) {
    const classified = classifyImportedIssues({ issues, requiresImportant: () => false })
    decisions.push(...classified.decisions.map((decision) => ({ targetProjectPath: projectPath, decision })))
    fatal.push(...classified.fatal.map(({ code }) => ({ projectPath, code })))
  }
  return { decisions, fatal }
}

function withPropertyStateCompatibilityMode(
  context: ImportConfigurationFromXmlParams["context"],
  root: Record<string, unknown>,
): ImportConfigurationFromXmlParams["context"] {
  const mode = findPropertyStateCompatibilityMode(root)
  return typeof mode === "string"
    ? { ...context, fromXML: { ...context.fromXML, propertyStateCompatibilityMode: mode } }
    : context
}

function findPropertyStateCompatibilityMode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const mode = findPropertyStateCompatibilityMode(item)
      if (mode !== undefined) return mode
    }
    return undefined
  }
  const record = value as Record<string, unknown>
  const properties = record.Properties
  if (typeof properties === "object" && properties !== null && !Array.isArray(properties)) {
    const mode = (properties as Record<string, unknown>).ConfigurationExtensionCompatibilityMode
    if (typeof mode === "string") return mode
  }
  for (const item of Object.values(record)) {
    const mode = findPropertyStateCompatibilityMode(item)
    if (mode !== undefined) return mode
  }
  return undefined
}

function importStatePhaseName(
  phase: import("../projectState/importSession").ProjectStateImportProfilePhase,
): string {
  return {
    workingIndex: "Фиксация рабочего индекса",
    semanticIndex: "Фиксация смыслового индекса",
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
  candidate: ConfigurationIndexCandidateStore,
  preparedStore: PreparedImportStore,
): XmlImportStateSink {
  const writeState = async (batch: Parameters<XmlImportStateSink["writeFirstPassState"]>[0]): Promise<void> => {
    if (batch.configurationFragment !== undefined) candidate.mergeBlockFragments([batch.configurationFragment])
    if (batch.configurationFragmentBuffer !== undefined) {
      candidate.mergeBlockFragments(decodeConfigurationBlockFragments(batch.configurationFragmentBuffer))
    }
    if (batch.stateFragment !== undefined) {
      await session.writeStateFragment(batch.stateFragment)
    }
    if (batch.preparedRecords !== undefined) {
      await Promise.all(batch.preparedRecords.map(({ locator, bytes }) => preparedStore.put(locator, bytes)))
    }
  }
  return {
    writeFirstPassState: writeState,
    writeSecondPassState: writeState,
    writeThirdPassState: writeState,
    async releasePrepared(assignmentIds) {
      await Promise.all(assignmentIds.map((assignmentId) => preparedStore.release(assignmentId)))
    },
  }
}

async function collectSnapshotFragments(params: {
  context: ConfigurationContextFromXML
  files: readonly ImportSnapshotFile[]
}): Promise<ConfigurationIndexBlockFragment[]> {
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

  const snapshotPath = configurationIndexStoreDescriptor(params.projectDir, params.address).dataPath
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

export function externalFileStateBatch(
  component: ValidationProjectComponent,
  files: readonly ConfigurationProjectFile[],
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

export function externalFileSemanticStateBatch(
  component: ValidationProjectComponent,
  files: readonly ImportExternalFile[],
): ProjectStateImportFinalFileStateBatch {
  return externalFileStateBatch(component, files.map(({ targetProjectPath }) => ({
    projectPath: targetProjectPath,
    contentHash: 0n,
  })))
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
    configurationIndexPath: configurationIndexStoreDescriptor(projectDir, address).dataPath,
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
  return calculateXmlImportConcurrency(availableParallelism(), totalmem(), constrainedMemory())
}

export function calculateXmlImportConcurrency(
  availableProcessors: number,
  totalMemoryBytes: number,
  constrainedMemoryBytes = 0,
): number {
  const workerOldSpaceBytes = 768 * 1024 ** 2
  const minimumReservedMemoryBytes = 2 * 1024 ** 3
  const effectiveMemoryBytes = constrainedMemoryBytes > 0
    ? Math.min(totalMemoryBytes, constrainedMemoryBytes)
    : totalMemoryBytes
  const reservedMemoryBytes = Math.max(minimumReservedMemoryBytes, effectiveMemoryBytes / 4)
  const byProcessors = Math.max(1, Math.floor(availableProcessors * 2 / 3))
  const byMemory = Math.max(1, Math.floor((effectiveMemoryBytes - reservedMemoryBytes) / workerOldSpaceBytes))
  return Math.min(byProcessors, byMemory)
}
