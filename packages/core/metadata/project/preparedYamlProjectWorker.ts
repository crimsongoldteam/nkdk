import { join, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { hashFileBytes } from "../configurationIndex/hash"
import {
  createProjectStateFileUpdateBatch,
  toProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
  type ProjectStateFileUpdateBatchEntry,
} from "../projectState/fileUpdate"
import type { ConfigurationContext } from "../context/types"
import { createOwnerMetadataCacheFromSharedProjectValidationGraph } from "../validation/dataPath/sharedOwnerCache"
import { createValidationProfiler } from "../validation/profile"
import { getProjectReferenceObjectPathContributor } from "../validation/projectReferenceIndexRegistry"
import type { PendingMetadataTargetReference } from "../validation/projectMetadataReferences"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { validationProjectComponentFromAddress } from "../validation/projectComponents"
import { createProjectYamlCacheFromEntries } from "../validation/projectYamlCache"
import { validatePendingReferencesWithIndex } from "../validation/projectReferenceIndex"
import {
  extractProjectValidationFileFacts,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  type ProjectValidationFirstPassProfile,
  type ProjectValidationFileState,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
} from "../validation/projectValidationPasses"
import { createProjectValidationWorkerSchemaCache } from "../validation/projectValidationWorkerSchemaCache"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createSharedProjectReferenceIndex } from "../validation/sharedProjectReferenceIndex"
import type { SharedProjectValidationGraph } from "../validation/sharedValidationSnapshot"
import type { Diagnostic } from "../validation/types"
import type {
  ComponentFirstPassPoolResult,
  ValidationFirstPassFileResult,
  ValidationYamlLifetime,
} from "../validation/validationWorkerPoolTypes"
import type { ValidationGraphContribution, ValidationIndexContribution } from "../validation/projectValidationTypes"
import { prepareYamlFiles } from "./prepareYamlFiles"
import type {
  PreparedMetadataDeclaration,
  PreparedMetadataDependency,
  PreparedYamlFile,
  PreparedYamlProjectFileDescriptor,
} from "./preparedYamlProject"

registerValidationMetadata()

export type PreparedYamlProjectWorkerTask =
  | {
      kind: "prepare"
      workerIndex: number
      projectDir: string
      itemTypeByYamlDir: Record<string, string>
      files: PreparedYamlProjectFileDescriptor[]
      includeYamlData: boolean
    }
  | {
      kind: "initValidation"
      workerIndex: number
      context: ConfigurationContext
      rulesSnapshot: ValidationRulesSnapshot
    }
  | {
      kind: "validateFirstPass"
      workerIndex: number
      projectDir: string
      context: ConfigurationContext
      files: PreparedYamlProjectFileDescriptor[]
    }
  | {
      kind: "collectValidationFacts"
      workerIndex: number
      projectDir: string
      files: PreparedYamlProjectFileDescriptor[]
      rulesSnapshot: ValidationRulesSnapshot
    }
  | {
      kind: "validateSecondPass"
      workerIndex: number
      projectDir: string
      context: ConfigurationContext
      sharedProjectValidationGraph: SharedProjectValidationGraph
      blockedComponentPaths: readonly string[]
      pendingReferenceLayers: Array<{
        componentPath: string
        references: PendingMetadataTargetReference[]
      }>
    }

export type PreparedYamlProjectWorkerTaskResult =
  | {
      kind: "prepareResult"
      yamlFiles: PreparedYamlFile[]
      declarations: PreparedMetadataDeclaration[]
      dependencies: PreparedMetadataDependency[]
      diagnostics: Diagnostic[]
    }
  | ({ kind: "initValidationResult" } & ValidationSchemaCacheCompileProfile)
  | {
      kind: "validateFirstPassResult"
      components: ComponentFirstPassPoolResult[]
      diagnostics: Diagnostic[]
      schemaDiagnostics: Diagnostic[]
      fileResults: ValidationFirstPassFileResult[]
      fileUpdateBatches: readonly ProjectStateFileUpdateBatch[]
      yamlLifetime: ValidationYamlLifetime
    }
  | {
      kind: "collectValidationFactsResult"
      contribution: ValidationIndexContribution
    }
  | {
      kind: "validateSecondPassResult"
      diagnostics: Diagnostic[]
    }

interface WorkerValidationState {
  states: Map<string, ProjectValidationFileState>
}

export default async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  if (message.kind === "initValidation") {
    const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
    validationSchemaCache = await profiler.measureAsync("Инициализация", "Инициализация validation worker", { items: 1 }, () =>
      createProjectValidationWorkerSchemaCache({ context: message.context })
    )
    validationRulesSnapshot = message.rulesSnapshot
    const compileProfile = { formMs: 0, propertiesMs: 0, totalMs: 0 }
    profiler.flush()
    return { kind: "initValidationResult", ...compileProfile }
  }
  if (message.kind === "validateFirstPass") return { kind: "validateFirstPassResult", ...runValidationFirstPass(message) }
  if (message.kind === "collectValidationFacts") {
    return {
      kind: "collectValidationFactsResult",
      contribution: await collectValidationFacts(message),
    }
  }
  if (message.kind === "validateSecondPass") {
    return { kind: "validateSecondPassResult", ...runValidationSecondPass(message) }
  }

  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  const prepareStartedAt = performance.now()
  const { yamlFiles, declarations, dependencies, diagnostics, profile } = prepareYamlFiles({
    files: message.files,
    itemTypeByYamlDir: message.itemTypeByYamlDir,
  })

  const responseYamlFiles = message.includeYamlData ? yamlFiles : yamlFiles.map(withoutYamlData)
  const response = {
    kind: "prepareResult" as const,
    yamlFiles: responseYamlFiles,
    declarations,
    dependencies,
    diagnostics,
  }
  const prepareMs = performance.now() - prepareStartedAt
  profiler.record("Подготовка YAML-проекта", "Выполнение подготовки в worker", {
    items: message.files.length,
    timeMs: prepareMs,
  })
  profiler.record("Подготовка YAML-проекта", "Чтение YAML", { items: message.files.length, timeMs: profile.readMs })
  profiler.record("Подготовка YAML-проекта", "Разбор YAML", { items: message.files.length, timeMs: profile.parseMs })
  profiler.record("Подготовка YAML-проекта", "Извлечение локальных индексов", { items: message.files.length, timeMs: profile.indexMs })
  profiler.record("Подготовка YAML-проекта", "Сохранение worker данных YAML", { items: message.files.length, timeMs: profile.saveMs })
  profiler.record("Подготовка YAML-проекта", "Объём результата worker", {
    items: responseYamlFiles.length,
    timeMs: 0,
    bytes: estimateProfilePayloadBytes(response),
  })
  profiler.flush()
  return response
}

interface CollectValidationFactsDependencies {
  readEntry?: typeof readProjectYamlEntryForValidation
  extractFacts?: typeof extractProjectValidationFileFacts
}

export async function collectValidationFacts(
  message: Extract<PreparedYamlProjectWorkerTask, { kind: "collectValidationFacts" }>,
  dependencies: CollectValidationFactsDependencies = {}
): Promise<ValidationIndexContribution> {
  const readEntry = dependencies.readEntry ?? readProjectYamlEntryForValidation
  const extractFacts = dependencies.extractFacts ?? extractProjectValidationFileFacts
  const contribution = emptyValidationIndexContribution()

  for (const descriptor of message.files) {
    const file = resolveValidationProjectFile(message.projectDir, descriptor.filePath)
    if (file === undefined) {
      throw new Error(`Не удалось классифицировать YAML-файл компонента: ${descriptor.filePath}`)
    }

    const entry = readEntry(file.absolutePath)
    if ("error" in entry) {
      throw new Error(`Не удалось прочитать YAML-файл ${file.absolutePath}: ${entry.error.message}`, {
        cause: entry.error,
      })
    }
    if (entry.parsed.syntaxErrors.length > 0) {
      const first = entry.parsed.syntaxErrors[0]
      const location = first === undefined ? "" : `:${first.line}:${first.col}`
      const details = first?.message ?? "неизвестная синтаксическая ошибка"
      throw new Error(`Не удалось разобрать YAML-файл ${file.absolutePath}${location}: ${details}`)
    }

    const facts = extractFacts({
      projectDir: message.projectDir,
      file,
      entry,
      rulesSnapshot: message.rulesSnapshot,
      validationDiagnostics: false,
    })
    contribution.objectRecords.push(...facts.objectRecords)
    contribution.objectIndexEntries.push(...facts.objectIndexEntries)
    contribution.memberIndexEntries.push(...facts.memberIndexEntries)
    contribution.valueIndexEntries.push(...facts.valueIndexEntries)
    contribution.pendingReferences.push(...facts.pendingReferences)
    contribution.localDependencies.push(...facts.localDependencies)
    contribution.logicalAddresses.push(
      ...[
        ...facts.objectIndexEntries,
        ...facts.memberIndexEntries,
        ...facts.valueIndexEntries,
      ].map(({ canonical }) => ({
        logicalAddress: canonical,
        sourceProjectPath: descriptor.projectPath,
      }))
    )
  }

  return contribution
}

function emptyValidationIndexContribution(): ValidationIndexContribution {
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

function withoutYamlData(file: PreparedYamlFile): PreparedYamlFile {
  const { data: _data, ...rest } = file
  return rest
}

function estimateProfilePayloadBytes(value: unknown): number | undefined {
  if (process.env["NKDK_PROFILE"] !== "1") return undefined
  return Buffer.byteLength(JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item)), "utf8")
}

let validationSchemaCache: ValidationSchemaCache | undefined
let validationRulesSnapshot: ValidationRulesSnapshot | undefined
let validationState = createEmptyWorkerValidationState()
const validationYamlLifetimeForTests = { current: 0, max: 0, parsed: 0, propertyEvents: 0 }

export function resetValidationYamlLifetimeForTests(): void {
  validationYamlLifetimeForTests.current = 0
  validationYamlLifetimeForTests.max = 0
  validationYamlLifetimeForTests.parsed = 0
  validationYamlLifetimeForTests.propertyEvents = 0
}

export function getValidationYamlLifetimeForTests(): Readonly<typeof validationYamlLifetimeForTests> {
  return { ...validationYamlLifetimeForTests }
}

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    states: new Map(),
  }
}

function runValidationFirstPass(message: Extract<PreparedYamlProjectWorkerTask, { kind: "validateFirstPass" }>): {
  components: ComponentFirstPassPoolResult[]
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
  fileUpdateBatches: readonly ProjectStateFileUpdateBatch[]
  yamlLifetime: ValidationYamlLifetime
} {
  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  validationState = createEmptyWorkerValidationState()
  resetValidationYamlLifetimeForTests()
  const components = new Map<string, ComponentFirstPassPoolResult>()
  const schemaCache = requireValidationSchemaCache()
  const firstPassProfile = createEmptyFirstPassProfileSummary()
  const fileUpdateEntries: ProjectStateFileUpdateBatchEntry[] = []

  for (const descriptor of message.files) {
    const component = componentFirstPassResult(components, descriptor.componentPath)
    const projectComponent = validationProjectComponentFromAddress(message.projectDir, descriptor)
    const file = resolveValidationProjectFile(descriptor.componentDir, descriptor.filePath, projectComponent)
    if (file === undefined) {
      const filePath = resolve(descriptor.filePath)
      component.diagnostics.push({
        filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "structure",
        message: `Не удалось классифицировать YAML-файл компонента: ${descriptor.rootProjectPath}`,
      })
      component.fileResults.push({
        componentPath: descriptor.componentPath,
        filePath,
        rootProjectPath: descriptor.rootProjectPath,
        contributedFacts: false,
        schemaDiagnostics: [],
      })
      continue
    }
    const entry = readProjectYamlEntryForValidation(file.absolutePath)
    if ("error" in entry) {
      const diagnostic = readProjectYamlDiagnostic(entry)
      component.diagnostics.push(diagnostic)
      component.fileResults.push({
        componentPath: descriptor.componentPath,
        filePath: file.absolutePath,
        rootProjectPath: descriptor.rootProjectPath,
        contributedFacts: false,
        schemaDiagnostics: [],
      })
      continue
    }

    validationYamlLifetimeForTests.current += 1
    validationYamlLifetimeForTests.parsed += 1
    validationYamlLifetimeForTests.max = Math.max(
      validationYamlLifetimeForTests.max,
      validationYamlLifetimeForTests.current
    )
    let first
    try {
      first = validateProjectFileFirstPass({
        projectDir: descriptor.componentDir,
        file,
        cache: createProjectYamlCacheFromEntries([entry]),
        context: message.context,
        schemaCache,
        rulesSnapshot: requireValidationRulesSnapshot(),
      })
    } finally {
      validationYamlLifetimeForTests.current -= 1
    }

    if (first.profile !== undefined) addFirstPassProfile(firstPassProfile, first.profile)
    validationYamlLifetimeForTests.propertyEvents += first.profile?.propertyEvents ?? 0
    validationState.states.set(resolve(file.absolutePath), first.state)
    component.contribution.objectRecords.push(...first.objectRecords)
    component.contribution.objectIndexEntries?.push(...first.objectIndexEntries)
    component.contribution.memberIndexEntries?.push(...first.memberIndexEntries)
    component.contribution.valueIndexEntries?.push(...first.valueIndexEntries)
    component.contribution.pendingReferences?.push(...first.pendingReferences)
    component.diagnostics.push(...first.diagnostics)
    component.schemaDiagnostics.push(...first.schemaDiagnostics)
    component.fileResults.push({
      componentPath: descriptor.componentPath,
      filePath: file.absolutePath,
      rootProjectPath: descriptor.rootProjectPath,
      contributedFacts: first.contributedFacts,
      schemaDiagnostics: first.schemaDiagnostics,
    })
    fileUpdateEntries.push({
      update: toProjectStateFileUpdate(first, {
        projectPath: descriptor.rootProjectPath,
        componentPath: descriptor.componentPath,
        resourceKind: "yaml",
        yamlRole: descriptor.role,
      }),
      hash: hashFileBytes(Buffer.from(entry.text, "utf8")),
    })
  }
  recordFirstPassProfile(profiler, message.files.length, firstPassProfile)
  profiler.flush()

  const componentResults = [...components.values()].sort((left, right) =>
    left.componentPath.localeCompare(right.componentPath, "ru")
  )
  return {
    components: componentResults,
    diagnostics: componentResults.flatMap(({ diagnostics }) => diagnostics),
    schemaDiagnostics: componentResults.flatMap(({ schemaDiagnostics }) => schemaDiagnostics),
    fileResults: componentResults.flatMap(({ fileResults }) => fileResults),
    fileUpdateBatches: [createProjectStateFileUpdateBatch(fileUpdateEntries)],
    yamlLifetime: getValidationYamlLifetimeForTests(),
  }
}

function componentFirstPassResult(
  components: Map<string, ComponentFirstPassPoolResult>,
  componentPath: string
): ComponentFirstPassPoolResult {
  const existing = components.get(componentPath)
  if (existing !== undefined) return existing

  const created: ComponentFirstPassPoolResult = {
    componentPath,
    contribution: emptyValidationGraphContribution(),
    diagnostics: [],
    schemaDiagnostics: [],
    fileResults: [],
  }
  components.set(componentPath, created)
  return created
}

function emptyValidationGraphContribution(): ValidationGraphContribution {
  return {
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

function createEmptyFirstPassProfileSummary(): Omit<ProjectValidationFirstPassProfile, "key"> {
  return {
    totalMs: 0,
    cacheMs: 0,
    schemaMs: 0,
    validatorsMs: 0,
    equalNameMs: 0,
    localValueValidationProfile: {},
    yamlFactsMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    diagnostics: 0,
    propertyEvents: 0,
  }
}

function addFirstPassProfile(
  summary: Omit<ProjectValidationFirstPassProfile, "key">,
  profile: ProjectValidationFirstPassProfile
): void {
  summary.totalMs += profile.totalMs
  summary.cacheMs += profile.cacheMs
  summary.schemaMs += profile.schemaMs
  summary.validatorsMs += profile.validatorsMs
  summary.equalNameMs += profile.equalNameMs
  mergeLocalValueValidationProfile(summary.localValueValidationProfile, profile.localValueValidationProfile)
  summary.yamlFactsMs += profile.yamlFactsMs
  summary.fieldIndexMs += profile.fieldIndexMs
  summary.objectIndexMs += profile.objectIndexMs
  summary.memberIndexMs += profile.memberIndexMs
  summary.valueIndexMs += profile.valueIndexMs
  summary.diagnostics += profile.diagnostics
  summary.propertyEvents += profile.propertyEvents
}

function recordFirstPassProfile(
  profiler: ReturnType<typeof createValidationProfiler>,
  items: number,
  profile: Omit<ProjectValidationFirstPassProfile, "key">
): void {
  profiler.record("Первичная проверка YAML", "Проверка JSON Schema", { items, timeMs: profile.schemaMs })
  profiler.record("Первичная проверка YAML", "Дополнительные валидаторы", { items, timeMs: profile.validatorsMs })
  profiler.record("Первичная проверка YAML", "Проверка equal-name", { items, timeMs: profile.equalNameMs })
  for (const [substep, value] of Object.entries(profile.localValueValidationProfile)) {
    profiler.record("Первичная проверка YAML", substep, value)
  }
  profiler.record("Первичная проверка YAML", "Извлечение YAML-фактов", { items, timeMs: profile.yamlFactsMs })
  profiler.record("Первичная проверка YAML", "Построение field index", { items, timeMs: profile.fieldIndexMs })
  profiler.record("Первичная проверка YAML", "Построение object index", { items, timeMs: profile.objectIndexMs })
  profiler.record("Первичная проверка YAML", "Построение member index", { items, timeMs: profile.memberIndexMs })
  profiler.record("Первичная проверка YAML", "Построение value index", { items, timeMs: profile.valueIndexMs })
}

function mergeLocalValueValidationProfile(
  target: Record<string, { items: number; timeMs: number }>,
  source: Readonly<Record<string, { items: number; timeMs: number }>>
): void {
  for (const [substep, value] of Object.entries(source)) {
    const current = target[substep]
    target[substep] = {
      items: (current?.items ?? 0) + value.items,
      timeMs: (current?.timeMs ?? 0) + value.timeMs,
    }
  }
}

function requireValidationSchemaCache(): ValidationSchemaCache {
  if (validationSchemaCache === undefined) throw new Error("Prepared YAML worker не инициализирован для validation")
  return validationSchemaCache
}

function requireValidationRulesSnapshot(): ValidationRulesSnapshot {
  if (validationRulesSnapshot === undefined) throw new Error("Prepared YAML worker rulesSnapshot не инициализирован")
  return validationRulesSnapshot
}

function runValidationSecondPass(message: Extract<PreparedYamlProjectWorkerTask, { kind: "validateSecondPass" }>): {
  diagnostics: Diagnostic[]
} {
  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  const diagnostics: Diagnostic[] = []
  const blocked = new Set(message.blockedComponentPaths)
  const activeStates = [...validationState.states.values()].filter(({ file }) => !blocked.has(file.componentPath))
  const activeReferenceLayers = message.pendingReferenceLayers.filter(({ componentPath }) => !blocked.has(componentPath))
  const activeComponentPaths = [
    ...new Set([
      ...activeStates.map(({ file }) => file.componentPath),
      ...activeReferenceLayers.map(({ componentPath }) => componentPath),
    ]),
  ]
  const views = profiler.measure(
    "Проверка зависимостей",
    "Построение контекста worker",
    { items: activeComponentPaths.length },
    () => {
      const views = new Map<
        string,
        {
          ownerCache: ReturnType<typeof createOwnerMetadataCacheFromSharedProjectValidationGraph>
          referenceIndex: ReturnType<typeof createSharedProjectReferenceIndex>
        }
      >()
      for (const componentPath of activeComponentPaths) {
        views.set(componentPath, {
          ownerCache: createOwnerMetadataCacheFromSharedProjectValidationGraph({
            projectDir: message.projectDir,
            componentPath,
            graph: message.sharedProjectValidationGraph,
          }),
          referenceIndex: createSharedProjectReferenceIndex({
            projectDir: message.projectDir,
            componentPath,
            snapshot: message.sharedProjectValidationGraph.reference,
            resolveObjectFilePath: (target) =>
              resolveObjectFilePath({
                projectDir: join(message.projectDir, componentPath),
                target,
              }),
          }),
        })
      }
      return views
    }
  )
  const view = (componentPath: string) => {
    const created = views.get(componentPath)
    if (created === undefined) throw new Error(`Не построен validation view компонента: ${componentPath}`)
    return created
  }
  const pendingReferenceCount = activeReferenceLayers.reduce(
    (count, layer) => count + layer.references.length,
    0
  )
  profiler.measure("Проверка зависимостей", "Проверка ссылок", { items: pendingReferenceCount }, () => {
    for (const layer of activeReferenceLayers) {
      const referenceResult = validatePendingReferencesWithIndex({
        index: view(layer.componentPath).referenceIndex,
        references: layer.references,
      })
      diagnostics.push(...referenceResult.diagnostics)
    }
  })

  profiler.measure("Проверка зависимостей", "Worker second pass", { items: activeStates.length }, () => {
    for (const state of activeStates) {
      const { ownerCache, referenceIndex } = view(state.file.componentPath)
      const second = validateProjectFileSecondPass({
        projectDir: message.projectDir,
        state,
        context: message.context,
        ownerCache,
        referenceIndex,
        skipMetadataTargetValidation: true,
      })
      diagnostics.push(...second.diagnostics)
    }
  })
  profiler.flush()

  validationState = createEmptyWorkerValidationState()

  return { diagnostics }
}

function resolveObjectFilePath(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}): string | undefined {
  const contributor = getProjectReferenceObjectPathContributor(params.target.root)
  return contributor?.({ projectDir: params.projectDir, target: params.target })?.filePath
}
