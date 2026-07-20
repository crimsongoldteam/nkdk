import { resolve } from "node:path"
import { performance } from "node:perf_hooks"
import type { ConfigurationContext } from "../context/types"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import { createValidationProfiler } from "../validation/profile"
import { ProjectFileSchemaError } from "../validation/projectFileSchema"
import { getProjectReferenceObjectPathContributor } from "../validation/projectReferenceIndexRegistry"
import type {
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
  PendingMetadataTargetReference,
} from "../validation/projectMetadataReferences"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createProjectYamlCacheFromPreparedFiles } from "../validation/projectYamlCache"
import { validatePendingReferencesWithIndex } from "../validation/projectReferenceIndex"
import {
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFirstPassProfile,
  type ProjectValidationFileState,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
} from "../validation/projectValidationPasses"
import { createProjectValidationWorkerSchemaCache } from "../validation/projectValidationWorkerSchemaCache"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createSharedProjectReferenceIndex } from "../validation/sharedProjectReferenceIndex"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type { Diagnostic } from "../validation/types"
import { validateProjectPartial } from "../validation/validateProjectPartial"
import type { ValidationMode, ValidationObjectRecord } from "../validation/projectValidationTypes"
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
    }
  | {
      kind: "validateSecondPass"
      workerIndex: number
      projectDir: string
      context: ConfigurationContext
      mode: ValidationMode
      sharedValidationSnapshot: SharedValidationSnapshot
      pendingReferences: PendingMetadataTargetReference[]
    }
  | {
      kind: "validatePartial"
      workerIndex: number
      projectDir: string
      filePath: string
      context: ConfigurationContext
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
      diagnostics: Diagnostic[]
      objectRecords: ValidationObjectRecord[]
      objectIndexEntries: ProjectObjectIndexEntry[]
      memberIndexEntries: ProjectMemberIndexEntry[]
      valueIndexEntries: ProjectValueIndexEntry[]
      pendingReferences: PendingMetadataTargetReference[]
    }
  | {
      kind: "validateSecondPassResult"
      diagnostics: Diagnostic[]
    }
  | {
      kind: "validatePartialResult"
      diagnostics: Diagnostic[]
    }

interface WorkerValidationState {
  states: Map<string, ProjectValidationFileState>
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}

export default async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  if (message.kind === "validatePartial") {
    try {
      const result = await validateProjectPartial(message)
      return { kind: "validatePartialResult", diagnostics: result.diagnostics }
    } catch (caught) {
      if (caught instanceof ProjectFileSchemaError) {
        throw new Error(caught.message, { cause: { code: "project_file_schema" } })
      }
      throw caught
    }
  }
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
  if (message.kind === "validateSecondPass") {
    return { kind: "validateSecondPassResult", ...runValidationSecondPass(message) }
  }

  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  const prepareStartedAt = performance.now()
  const { yamlFiles, declarations, dependencies, diagnostics, profile } = prepareYamlFiles({
    files: message.files,
    itemTypeByYamlDir: message.itemTypeByYamlDir,
  })

  preparedYamlFiles = new Map(yamlFiles.map((file) => [file.filePath, file]))
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

function withoutYamlData(file: PreparedYamlFile): PreparedYamlFile {
  const { data: _data, ...rest } = file
  return rest
}

function estimateProfilePayloadBytes(value: unknown): number | undefined {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return undefined
  return Buffer.byteLength(JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item)), "utf8")
}

let preparedYamlFiles = new Map<string, PreparedYamlFile>()
let validationSchemaCache: ValidationSchemaCache | undefined
let validationRulesSnapshot: ValidationRulesSnapshot | undefined
let validationState = createEmptyWorkerValidationState()

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    states: new Map(),
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

function runValidationFirstPass(message: Extract<PreparedYamlProjectWorkerTask, { kind: "validateFirstPass" }>): {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
} {
  const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
  validationState = createEmptyWorkerValidationState()
  const diagnostics: Diagnostic[] = []
  const objectRecords: ValidationObjectRecord[] = []
  const schemaCache = requireValidationSchemaCache()
  const cache = createProjectYamlCacheFromPreparedFiles([...preparedYamlFiles.values()])
  const firstPassProfile = createEmptyFirstPassProfileSummary()

  for (const yamlFile of preparedYamlFiles.values()) {
    const file = resolveValidationProjectFile(message.projectDir, yamlFile.filePath)
    if (file === undefined) continue

    const first = validateProjectFileFirstPass({
      projectDir: message.projectDir,
      file,
      cache,
      context: message.context,
      schemaCache,
      rulesSnapshot: requireValidationRulesSnapshot(),
    })

    if (first.profile !== undefined) addFirstPassProfile(firstPassProfile, first.profile)
    validationState.states.set(resolve(file.absolutePath), first.state)
    validationState.objectIndexEntries.push(...first.objectIndexEntries)
    validationState.memberIndexEntries.push(...first.memberIndexEntries)
    validationState.valueIndexEntries.push(...first.valueIndexEntries)
    validationState.pendingReferences.push(...first.pendingReferences)
    diagnostics.push(...first.diagnostics)
    objectRecords.push(...first.objectRecords)
  }
  recordFirstPassProfile(profiler, preparedYamlFiles.size, firstPassProfile)
  profiler.flush()

  return {
    diagnostics,
    objectRecords,
    objectIndexEntries: validationState.objectIndexEntries,
    memberIndexEntries: validationState.memberIndexEntries,
    valueIndexEntries: validationState.valueIndexEntries,
    pendingReferences: validationState.pendingReferences,
  }
}

function createEmptyFirstPassProfileSummary(): Omit<ProjectValidationFirstPassProfile, "key"> {
  return {
    totalMs: 0,
    cacheMs: 0,
    schemaMs: 0,
    validatorsMs: 0,
    equalNameMs: 0,
    yamlFactsMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    diagnostics: 0,
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
  summary.yamlFactsMs += profile.yamlFactsMs
  summary.fieldIndexMs += profile.fieldIndexMs
  summary.objectIndexMs += profile.objectIndexMs
  summary.memberIndexMs += profile.memberIndexMs
  summary.valueIndexMs += profile.valueIndexMs
  summary.diagnostics += profile.diagnostics
}

function recordFirstPassProfile(
  profiler: ReturnType<typeof createValidationProfiler>,
  items: number,
  profile: Omit<ProjectValidationFirstPassProfile, "key">
): void {
  profiler.record("Первичная проверка YAML", "Проверка JSON Schema", { items, timeMs: profile.schemaMs })
  profiler.record("Первичная проверка YAML", "Дополнительные валидаторы", { items, timeMs: profile.validatorsMs })
  profiler.record("Первичная проверка YAML", "Проверка equal-name", { items, timeMs: profile.equalNameMs })
  profiler.record("Первичная проверка YAML", "Извлечение YAML-фактов", { items, timeMs: profile.yamlFactsMs })
  profiler.record("Первичная проверка YAML", "Построение field index", { items, timeMs: profile.fieldIndexMs })
  profiler.record("Первичная проверка YAML", "Построение object index", { items, timeMs: profile.objectIndexMs })
  profiler.record("Первичная проверка YAML", "Построение member index", { items, timeMs: profile.memberIndexMs })
  profiler.record("Первичная проверка YAML", "Построение value index", { items, timeMs: profile.valueIndexMs })
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
  const { cache, ownerCache, referenceIndex } = profiler.measure(
    "Проверка зависимостей",
    "Построение контекста worker",
    { items: preparedYamlFiles.size },
    () => {
      const cache = createProjectYamlCacheFromPreparedFiles([...preparedYamlFiles.values()])
      const ownerCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
        projectDir: message.projectDir,
        snapshot: message.sharedValidationSnapshot,
      })
      const referenceIndex = createSharedProjectReferenceIndex({
        projectDir: message.projectDir,
        mode: message.mode,
        snapshot: message.sharedValidationSnapshot.reference,
        resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir: message.projectDir, target }),
      })
      return { cache, ownerCache, referenceIndex }
    }
  )
  const referenceResult = profiler.measure("Проверка зависимостей", "Проверка ссылок", { items: message.pendingReferences.length }, () =>
    validatePendingReferencesWithIndex({
      index: referenceIndex,
      references: message.pendingReferences,
    })
  )
  diagnostics.push(...referenceResult.diagnostics)

  profiler.measure("Проверка зависимостей", "Worker second pass", { items: validationState.states.size }, () => {
    for (const state of validationState.states.values()) {
      const second = validateProjectFileSecondPass({
        projectDir: message.projectDir,
        state,
        cache,
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
