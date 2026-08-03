import { resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { hashFileBytes } from "../configurationIndex/hash"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import {
  createProjectStateFileUpdateBatch,
  toProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
  type ProjectStateFileUpdateBatchEntry,
} from "../projectState/fileUpdate"
import type { ConfigurationContext } from "../context/types"
import { createValidationProfiler } from "../validation/profile"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { validationProjectComponentFromAddress } from "../validation/projectComponents"
import { createProjectYamlCacheFromEntries } from "../validation/projectYamlCache"
import {
  extractProjectValidationFileFacts,
  validateProjectFileFirstPass,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  type ProjectValidationFirstPassProfile,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
} from "../validation/projectValidationPasses"
import { createProjectValidationWorkerSchemaCache } from "../validation/projectValidationWorkerSchemaCache"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
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

export const LOCAL_VALIDATION_BATCH_SIZE = 32

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
      kind: "validateLocal"
      workerIndex: number
      projectDir: string
      context: ConfigurationContext
      files: Array<{ readonly descriptor: PreparedYamlProjectFileDescriptor; readonly bytes: Uint8Array }>
      hashBytes: Uint8Array
    }
  | {
      kind: "collectValidationFacts"
      workerIndex: number
      projectDir: string
      files: PreparedYamlProjectFileDescriptor[]
      rulesSnapshot: ValidationRulesSnapshot
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
      kind: "validateLocalResult"
      diagnostics: Diagnostic[]
      fileUpdateBatches: readonly ProjectStateFileUpdateBatch[]
      parsedYamlFiles: number
    }
  | {
      kind: "collectValidationFactsResult"
      contribution: ValidationIndexContribution
    }

export async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask,
  options: {
    createValidationSchemaCache?: typeof createProjectValidationWorkerSchemaCache
  } = {},
): Promise<PreparedYamlProjectWorkerTaskResult> {
  if (message.kind === "initValidation") {
    const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
    validationSchemaCache = await profiler.measureAsync("Инициализация", "Инициализация validation worker", { items: 1 }, () =>
      (options.createValidationSchemaCache ?? createProjectValidationWorkerSchemaCache)({
        context: message.context,
      })
    )
    validationRulesSnapshot = message.rulesSnapshot
    const compileProfile = { formMs: 0, propertiesMs: 0, totalMs: 0 }
    profiler.flush()
    return { kind: "initValidationResult", ...compileProfile }
  }
  if (message.kind === "validateFirstPass") return { kind: "validateFirstPassResult", ...runValidationFirstPass(message) }
  if (message.kind === "validateLocal") {
    if (message.files.length > LOCAL_VALIDATION_BATCH_SIZE) {
      throw new Error(`Локальная worker-задача должна содержать не более ${LOCAL_VALIDATION_BATCH_SIZE} YAML`)
    }
    const result = runValidationFirstPass(message)
    return {
      kind: "validateLocalResult",
      diagnostics: result.diagnostics,
      fileUpdateBatches: result.fileUpdateBatches,
      parsedYamlFiles: result.yamlLifetime.parsed,
    }
  }
  if (message.kind === "collectValidationFacts") {
    return {
      kind: "collectValidationFactsResult",
      contribution: await collectValidationFacts(message),
    }
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

export default async function preparedYamlProjectWorkerEntryPoint(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  const result = await runPreparedYamlProjectWorkerTask(message)
  return result.kind === "validateFirstPassResult" || result.kind === "validateLocalResult"
    ? movableValidationResult(result)
    : result
}

type TransferableValidationWorkerResult = Extract<
  PreparedYamlProjectWorkerTaskResult,
  { kind: "validateFirstPassResult" | "validateLocalResult" }
>

export function createValidationFirstPassTransferable(result: TransferableValidationWorkerResult) {
  return {
    get [transferableSymbol]() {
      return result.fileUpdateBatches.map(({ hashBytes }) => hashBytes.buffer as ArrayBuffer)
    },
    get [valueSymbol]() {
      return result
    },
  }
}

function movableValidationResult(result: TransferableValidationWorkerResult): TransferableValidationWorkerResult {
  return move(createValidationFirstPassTransferable(result)) as unknown as TransferableValidationWorkerResult
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

function runValidationFirstPass(message: Extract<PreparedYamlProjectWorkerTask, { kind: "validateFirstPass" | "validateLocal" }>): {
  components: ComponentFirstPassPoolResult[]
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
  fileUpdateBatches: readonly ProjectStateFileUpdateBatch[]
  yamlLifetime: ValidationYamlLifetime
} {
  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  resetValidationYamlLifetimeForTests()
  const components = new Map<string, ComponentFirstPassPoolResult>()
  const schemaCache = requireValidationSchemaCache()
  const firstPassProfile = createEmptyFirstPassProfileSummary()
  const fileUpdateEntries: ProjectStateFileUpdateBatchEntry[] = []

  const descriptors = message.kind === "validateLocal"
    ? message.files.map(({ descriptor }) => descriptor)
    : message.files
  if (message.kind === "validateLocal" && message.hashBytes.byteLength !== descriptors.length * 8) {
    throw new Error("Локальная validation получила неверную длину общего hashBytes")
  }

  for (let descriptorIndex = 0; descriptorIndex < descriptors.length; descriptorIndex += 1) {
    const descriptor = descriptors[descriptorIndex]!
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
    const entry = message.kind === "validateLocal"
      ? projectYamlEntryFromBytes(file.absolutePath, message.files[descriptorIndex]!.bytes)
      : readProjectYamlEntryForValidation(file.absolutePath)
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
      ...(message.kind === "validateLocal"
        ? { hashBytes: message.hashBytes.slice(descriptorIndex * 8, descriptorIndex * 8 + 8) }
        : { hash: hashFileBytes(Buffer.from(entry.text, "utf8")) }),
    })
  }
  recordFirstPassProfile(profiler, descriptors.length, firstPassProfile)
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

function projectYamlEntryFromBytes(filePath: string, bytes: Uint8Array) {
  const text = new TextDecoder().decode(bytes)
  return { filePath, text, parsed: parseMetadataYaml(text) }
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
