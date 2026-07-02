import { availableParallelism } from "node:os"
import { performance } from "node:perf_hooks"
import { existsSync } from "fs"
import { resolve } from "path"
import type { ConfigurationContext } from "../context/types"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { getProjectReferenceObjectPathContributor } from "./projectReferenceIndexRegistry"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  validatePendingReferencesWithIndex,
} from "./projectReferenceIndex"
import { ProjectFileSchemaError } from "./projectFileSchema"
import {
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
  type ValidationProjectFile,
} from "./projectFiles"
import { createProjectYamlCacheFromEntries, type ProjectYamlEntry } from "./projectYamlCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import { createProjectValidationWorkerPool } from "./projectValidationWorkerPool"
import type { ValidationMode, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import {
  createValidationSchemaCache,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import { createValidationYamlQueue } from "./projectValidationQueue"
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

const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  if (params.filePath !== undefined || concurrency === 1) {
    return validateProjectInProcess({ ...params, concurrency: 1 })
  }
  return validateProjectWithWorkers({ ...params, concurrency })
}

function validateProjectInProcess(params: ValidateProjectParams): ValidateProjectResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const schemaCache = createValidationSchemaCache(context)
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
  processPendingFirstPasses({ projectDir, context, schemaCache, queue, entries, states, objectTable, diagnostics })
  const skipMetadataTargetValidation = params.filePath === undefined

  if (skipMetadataTargetValidation) {
    const objectTableSnapshot = objectTable.snapshot()
    const referenceSnapshot = createProjectReferenceSnapshot({
      objectIndexEntries: objectTableSnapshot.objectIndexEntries ?? [],
      memberIndexEntries: objectTableSnapshot.memberIndexEntries ?? [],
      valueIndexEntries: objectTableSnapshot.valueIndexEntries ?? [],
      pendingReferences: objectTableSnapshot.pendingReferences ?? [],
    })
    const referenceIndex = createProjectReferenceIndex({
      projectDir,
      mode: queue.mode,
      snapshot: referenceSnapshot,
      resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir, target }),
      resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir, target }),
    })
    const referenceResult = validatePendingReferencesWithIndex({
      index: referenceIndex,
      references: referenceSnapshot.pendingReferences,
    })
    logInProcessReferenceProfile({ snapshot: referenceSnapshot, result: referenceResult })
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
      const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir, table: objectTable })
      const referenceIndex = createReferenceIndexFromObjectTable({
        projectDir,
        mode: queue.mode,
        objectTable: objectTable.snapshot(),
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
      processPendingFirstPasses({ projectDir, context, schemaCache, queue, entries, states, objectTable, diagnostics })
      for (const stateKey of states.keys()) secondPassPending.add(stateKey)
    }
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}

async function validateProjectWithWorkers(
  params: ValidateProjectParams & { concurrency: number }
): Promise<ValidateProjectResult> {
  const totalStartedAt = performance.now()
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const discoverStartedAt = performance.now()
  const files = discoverValidationProjectFiles(projectDir)
  const discoverMs = performance.now() - discoverStartedAt
  const pool = createProjectValidationWorkerPool({ concurrency: params.concurrency })
  let startMs = 0
  let firstPassMs = 0
  let mergeMs = 0
  let snapshotMs = 0
  let secondPassMs = 0
  let sortMs = 0

  try {
    const startStartedAt = performance.now()
    await pool.start()
    startMs = performance.now() - startStartedAt
    const firstPassStartedAt = performance.now()
    const first = await pool.runFirstPass({ projectDir, context, files })
    firstPassMs = performance.now() - firstPassStartedAt
    const mergeStartedAt = performance.now()
    const objectTable = createValidationObjectTable()
    objectTable.mergeRecords(first.objectRecords)
    objectTable.mergeReferenceIndexEntries(first)
    mergeMs = performance.now() - mergeStartedAt
    const snapshotStartedAt = performance.now()
    const objectTableSnapshot = objectTable.snapshot()
    snapshotMs = performance.now() - snapshotStartedAt
    const secondPassStartedAt = performance.now()
    const second = await pool.runSecondPass({
      projectDir,
      context,
      mode: "full",
      objectTable: objectTableSnapshot,
    })
    secondPassMs = performance.now() - secondPassStartedAt
    const sortStartedAt = performance.now()
    const diagnostics = sortDiagnostics(dedupeDiagnostics([...first.diagnostics, ...second.diagnostics]))
    sortMs = performance.now() - sortStartedAt
    logWorkerValidationProfile({
      files: files.length,
      concurrency: params.concurrency,
      discoverMs,
      startMs,
      firstPassMs,
      mergeMs,
      snapshotMs,
      secondPassMs,
      sortMs,
      totalMs: performance.now() - totalStartedAt,
    })

    return { diagnostics }
  } finally {
    await pool.close()
  }
}

function logWorkerValidationProfile(params: {
  files: number
  concurrency: number
  discoverMs: number
  startMs: number
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
  snapshot: ReturnType<typeof createProjectReferenceSnapshot>
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
      `snapshotBytes=${params.snapshot.stats.snapshotBytes}`,
      `pending=${params.snapshot.stats.pendingReferences}`,
      `entries=${params.snapshot.stats.memberEntries}`,
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

function createReferenceIndexFromObjectTable(params: {
  projectDir: string
  mode: ValidationMode
  objectTable: ValidationObjectTableSnapshot
}) {
  const snapshot = createProjectReferenceSnapshot({
    objectIndexEntries: params.objectTable.objectIndexEntries ?? [],
    memberIndexEntries: params.objectTable.memberIndexEntries ?? [],
    valueIndexEntries: params.objectTable.valueIndexEntries ?? [],
    pendingReferences: params.objectTable.pendingReferences ?? [],
  })
  return createProjectReferenceIndex({
    projectDir: params.projectDir,
    mode: params.mode,
    snapshot,
    resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir: params.projectDir, target }),
    resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir: params.projectDir, target }),
  })
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
