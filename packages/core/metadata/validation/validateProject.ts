import { availableParallelism } from "node:os"
import { performance } from "node:perf_hooks"
import { existsSync } from "fs"
import { resolve } from "path"
import type { ConfigurationContext } from "../context/types"
import { prepareYamlProjectWithPool } from "../project/preparedYamlProject"
import {
  createPreparedYamlProjectWorkerPool,
  type PreparedYamlProjectWorkerPool,
} from "../project/preparedYamlProjectWorkerPool"
import { getProjectReferenceObjectPathContributor } from "./projectReferenceIndexRegistry"
import { validatePendingReferencesWithIndex } from "./projectReferenceIndex"
import { ProjectFileSchemaError } from "./projectFileSchema"
import { createValidationProfiler } from "./profile"
import {
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
  type ValidationProjectFile,
} from "./projectFiles"
import { createProjectYamlCacheFromEntries, type ProjectYamlEntry } from "./projectYamlCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import {
  createValidationSchemaCache,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import { createValidationYamlQueue } from "./projectValidationQueue"
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"
import { createValidationRulesSnapshot, type ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"

export interface ValidateProjectParams {
  projectDir: string
  filePath?: string
  context?: ConfigurationContext
  concurrency?: number
}

export interface ValidateProjectResult {
  diagnostics: Diagnostic[]
}

export interface ValidationWorkerPoolHandle {
  validateProject(params: Omit<ValidateProjectParams, "concurrency">): Promise<ValidateProjectResult>
  close(): Promise<void>
  size(): number
}

const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  if (params.filePath !== undefined) {
    return validateProjectInProcess({ ...params, concurrency: 1 })
  }
  return validateProjectWithPreparedYaml({ ...params, concurrency })
}

export function createValidationWorkerPoolHandle(params: { concurrency?: number } = {}): ValidationWorkerPoolHandle {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  const pool = createPreparedYamlProjectWorkerPool({ concurrency })
  let closed = false
  let currentRun: Promise<void> = Promise.resolve()

  async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const previous = currentRun
    let release: () => void = () => undefined
    currentRun = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await task()
    } finally {
      release()
    }
  }

  return {
    validateProject(projectParams) {
      if (closed) throw new Error("Validation worker pool handle is closed")
      return runExclusive(async () => {
        if (projectParams.filePath !== undefined) {
          return validateProjectInProcess({ ...projectParams, concurrency: 1 })
        }
        return validateProjectWithPreparedYaml({
          ...projectParams,
          concurrency,
          pool,
          closePool: false,
        })
      })
    },
    async close() {
      if (closed) return
      closed = true
      await currentRun
      await pool.close()
    },
    size() {
      return pool.size()
    },
  }
}

function validateProjectInProcess(params: ValidateProjectParams): ValidateProjectResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const schemaCache = createValidationSchemaCache(context)
  const rulesSnapshot = createValidationRulesSnapshot(context)
  const files =
    params.filePath === undefined
      ? discoverValidationProjectFiles(projectDir)
      : [resolveSingleProjectFile(projectDir, params.filePath)]
  const queue = createValidationYamlQueue({
    mode: params.filePath === undefined ? "full" : "partial",
    initialFiles: files,
  })
  const objectTable = createValidationObjectTable()
  const entries = new Map<string, ProjectYamlEntry>()
  const states = new Map<string, ProjectValidationFileState>()

  const diagnostics: Diagnostic[] = []
  processPendingFirstPasses({
    projectDir,
    context,
    schemaCache,
    rulesSnapshot,
    queue,
    entries,
    states,
    objectTable,
    diagnostics,
  })
  const skipMetadataTargetValidation = params.filePath === undefined

  if (skipMetadataTargetValidation) {
    const objectTableSnapshot = objectTable.snapshot()
    const provider = createValidationSnapshotProvider(objectTableSnapshot)
    const referenceIndex = provider.referenceIndex({
      projectDir,
      mode: queue.mode,
      resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir, target }),
      resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir, target }),
    })
    const pendingReferences = objectTableSnapshot.pendingReferences ?? []
    const referenceResult = validatePendingReferencesWithIndex({
      index: referenceIndex,
      references: pendingReferences,
    })
    logInProcessReferenceProfile({
      snapshotBytes: provider.sharedPayload().reference.stats.snapshotBytes,
      pendingReferences: pendingReferences.length,
      memberIndexEntries: provider.sharedPayload().reference.stats.memberEntries,
      result: referenceResult,
    })
    diagnostics.push(...referenceResult.diagnostics)
  }

  const secondPassPending = new Set(states.keys())
  while (secondPassPending.size > 0) {
    let enqueuedDependency = false
    for (const stateKey of [...secondPassPending]) {
      const state = states.get(stateKey)
      if (state === undefined) {
        secondPassPending.delete(stateKey)
        continue
      }

      const cache = createProjectYamlCacheFromEntries([...entries.values()])
      const objectTableSnapshot = objectTable.snapshot()
      const provider = createValidationSnapshotProvider(objectTableSnapshot)
      const ownerCache = provider.ownerCache(projectDir)
      const referenceIndex = provider.referenceIndex({
        projectDir,
        mode: queue.mode,
        resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir, target }),
        resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir, target }),
      })
      const second = validateProjectFileSecondPass({
        projectDir,
        state,
        cache,
        context,
        ownerCache,
        referenceIndex,
        skipMetadataTargetValidation,
      })

      if (second.status === "needsDependency" && queue.enqueueDependency(second.dependency.file) === "enqueued") {
        enqueuedDependency = true
        break
      }

      diagnostics.push(...second.diagnostics)
      secondPassPending.delete(stateKey)
    }

    if (enqueuedDependency) {
      processPendingFirstPasses({
        projectDir,
        context,
        schemaCache,
        rulesSnapshot,
        queue,
        entries,
        states,
        objectTable,
        diagnostics,
      })
      for (const stateKey of states.keys()) secondPassPending.add(stateKey)
    }
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}

async function validateProjectWithPreparedYaml(
  params: ValidateProjectParams & {
    concurrency: number
    pool?: PreparedYamlProjectWorkerPool
    closePool?: boolean
  }
): Promise<ValidateProjectResult> {
  const totalStartedAt = performance.now()
  const initializationProfiler = createValidationProfiler({ scope: "main" })
  const profiler = createValidationProfiler({ scope: "main" })
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const pool = params.pool ?? createPreparedYamlProjectWorkerPool({ concurrency: params.concurrency })
  const closePool = params.closePool ?? true
  let startMs = 0
  let schemaCompileMs = 0
  let formSchemaMs = 0
  let propertiesSchemaMs = 0
  let firstPassMs = 0
  let mergeMs = 0
  let snapshotMs = 0
  let secondPassMs = 0
  let sortMs = 0
  let fileCount = 0

  try {
    const prepareStartedAt = performance.now()
    const prepared = await prepareYamlProjectWithPool({
      projectDir,
      context,
      pool,
      includeYamlData: false,
      resourceInclude: "yaml",
    })
    const prepareMs = performance.now() - prepareStartedAt
    if (!prepared.ok) return { diagnostics: sortDiagnostics(dedupeDiagnostics(prepared.diagnostics)) }

    fileCount = prepared.project.files.length
    const startProfile = await initializationProfiler.measureAsync(
      "Инициализация",
      "Инициализация validation worker",
      { items: params.concurrency },
      () => pool.initValidation(context)
    )
    startMs = startProfile.workerInitMs
    schemaCompileMs = startProfile.schemaCompileMs
    formSchemaMs = startProfile.formSchemaMs
    propertiesSchemaMs = startProfile.propertiesSchemaMs
    initializationProfiler.record("Инициализация", "Компиляция схем", {
      items: params.concurrency,
      timeMs: schemaCompileMs,
    })
    initializationProfiler.flush()
    const firstPassStartedAt = performance.now()
    const first = await pool.runValidationFirstPass({ projectDir, context })
    firstPassMs = performance.now() - firstPassStartedAt
    const objectTable = profiler.measure("Обобщение индексов", "Слияние first pass", { items: first.objectRecords.length }, () => {
      const table = createValidationObjectTable()
      table.mergeRecords(first.objectRecords)
      table.mergeReferenceIndexEntries(first)
      return table
    })
    mergeMs = profiler.records().find((record) => record.substep === "Слияние first pass")?.timeMs ?? 0
    const objectTableSnapshot = profiler.measure(
      "Обобщение индексов",
      "Снимок object table",
      { items: first.pendingReferences.length },
      () => objectTable.snapshot()
    )
    snapshotMs = profiler.records().find((record) => record.substep === "Снимок object table")?.timeMs ?? 0
    const second = await profiler.measureAsync("Проверка зависимостей", "Ожидание worker second pass", { items: fileCount }, () =>
      pool.runValidationSecondPass({
        projectDir,
        context,
        mode: "full",
        objectTable: objectTableSnapshot,
      })
    )
    secondPassMs = profiler.records().find((record) => record.substep === "Ожидание worker second pass")?.timeMs ?? 0
    const diagnostics = profiler.measure(
      "Завершение validation",
      "Сортировка и дедупликация диагностик",
      { items: first.diagnostics.length + second.diagnostics.length },
      () => sortDiagnostics(dedupeDiagnostics([...first.diagnostics, ...second.diagnostics]))
    )
    sortMs = profiler.records().find((record) => record.substep === "Сортировка и дедупликация диагностик")?.timeMs ?? 0
    profiler.flush()
    logWorkerValidationProfile({
      files: fileCount,
      concurrency: params.concurrency,
      discoverMs: prepareMs,
      startMs,
      schemaCompileMs,
      formSchemaMs,
      propertiesSchemaMs,
      firstPassMs,
      mergeMs,
      snapshotMs,
      secondPassMs,
      sortMs,
      totalMs: performance.now() - totalStartedAt,
    })

    return { diagnostics }
  } finally {
    if (closePool) await pool.close()
  }
}

function logWorkerValidationProfile(params: {
  files: number
  concurrency: number
  discoverMs: number
  startMs: number
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  firstPassMs: number
  mergeMs: number
  snapshotMs: number
  secondPassMs: number
  sortMs: number
  totalMs: number
}): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return
  console.error(
    [
      "[validation-profile] orchestration",
      `files=${params.files}`,
      `concurrency=${params.concurrency}`,
      `discover=${params.discoverMs.toFixed(2)}ms`,
      `startWorkers=${params.startMs.toFixed(2)}ms`,
      `schemaCompile=${params.schemaCompileMs.toFixed(2)}ms`,
      `formSchema=${params.formSchemaMs.toFixed(2)}ms`,
      `propertiesSchema=${params.propertiesSchemaMs.toFixed(2)}ms`,
      `firstPassWall=${params.firstPassMs.toFixed(2)}ms`,
      `mergeFirstPass=${params.mergeMs.toFixed(2)}ms`,
      `objectTableSnapshot=${params.snapshotMs.toFixed(2)}ms`,
      `secondPassWall=${params.secondPassMs.toFixed(2)}ms`,
      `sortDedupe=${params.sortMs.toFixed(2)}ms`,
      `total=${params.totalMs.toFixed(2)}ms`,
    ].join(" ")
  )
}

function normalizeValidationConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isInteger(value) || value < 1) throw new Error("validation concurrency must be a positive integer")
    return value
  }

  return Math.max(1, Math.min(4, availableParallelism() - 1))
}

function processPendingFirstPasses(params: {
  projectDir: string
  context: ConfigurationContext
  schemaCache: ReturnType<typeof createValidationSchemaCache>
  rulesSnapshot: ValidationRulesSnapshot
  queue: ReturnType<typeof createValidationYamlQueue>
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
  objectTable: ReturnType<typeof createValidationObjectTable>
  diagnostics: Diagnostic[]
}): void {
  while (params.queue.hasPending()) {
    const batch = params.queue.takePending(64)
    for (const file of batch) {
      params.queue.markRunning(file.absolutePath)
      const entry = readProjectYamlEntryForValidation(file.absolutePath)
      if ("error" in entry) {
        params.queue.markError(file.absolutePath)
        params.diagnostics.push(readProjectYamlDiagnostic(entry))
        continue
      }

      const entryKey = resolve(entry.filePath)
      params.entries.set(entryKey, entry)
      const cache = createProjectYamlCacheFromEntries([...params.entries.values()])
      const first = validateProjectFileFirstPass({
        projectDir: params.projectDir,
        file,
        cache,
        context: params.context,
        schemaCache: params.schemaCache,
        rulesSnapshot: params.rulesSnapshot,
      })
      params.states.set(resolve(file.absolutePath), first.state)
      params.objectTable.mergeRecords(first.objectRecords)
      params.objectTable.mergeReferenceIndexEntries(first)
      params.diagnostics.push(...first.diagnostics)
      params.queue.markReady(file.absolutePath)
    }
  }
}

function resolveSingleProjectFile(projectDir: string, filePath: string): ValidationProjectFile {
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file) return file

  throw new ProjectFileSchemaError(expectedPatterns)
}

function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((left, right) => {
    return (
      left.filePath.localeCompare(right.filePath) ||
      left.line - right.line ||
      left.col - right.col ||
      left.severity.localeCompare(right.severity) ||
      left.message.localeCompare(right.message)
    )
  })
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const result: Diagnostic[] = []
  const seen = new Set<string>()
  for (const diagnostic of diagnostics) {
    const key = diagnosticKey(diagnostic)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(diagnostic)
  }
  return result
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return [
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.col,
    diagnostic.source,
    diagnostic.severity,
    diagnostic.path ?? "",
    diagnostic.message,
  ].join("\0")
}

function logInProcessReferenceProfile(params: {
  snapshotBytes: number
  pendingReferences: number
  memberIndexEntries: number
  result: ReturnType<typeof validatePendingReferencesWithIndex>
}): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return
  const references = params.result.stats

  console.error(
    [
      "[validation-profile] references second-pass",
      `hits=${references.hits}`,
      `misses=${references.misses}`,
      `conflicts=${references.conflicts}`,
      `filters=${references.filterFailures}`,
      `dependencies=${references.dependencies}`,
      `unsupported=${references.unsupported}`,
      `fallbacks=${references.fallbacks}`,
      `snapshotBytes=${params.snapshotBytes}`,
      `pending=${params.pendingReferences}`,
      `entries=${params.memberIndexEntries}`,
    ].join(" ")
  )
}

function resolveProjectFileDependency(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}) {
  const filePath = resolveObjectFilePath(params)
  if (filePath === undefined || !existsSync(filePath)) return undefined
  const file = resolveValidationProjectFile(params.projectDir, filePath)
  if (file === undefined) return undefined
  return { kind: "needsDependency" as const, file, requestedBy: filePath }
}

function resolveObjectFilePath(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}): string | undefined {
  const contributor = getProjectReferenceObjectPathContributor(params.target.root)
  return contributor?.({ projectDir: params.projectDir, target: params.target })?.filePath
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
