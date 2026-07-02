import { availableParallelism } from "node:os"
import { resolve } from "path"
import type { ConfigurationContext } from "../context/types"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createProjectMetadataResolverFromValidationTable } from "./projectMetadataResolver"
import { createProjectReferenceSnapshot, validatePendingReferences } from "./projectMetadataReferences"
import { ProjectFileSchemaError } from "./projectFileSchema"
import {
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
  type ValidationProjectFile,
} from "./projectFiles"
import { createProjectYamlCacheFromEntries, type ProjectYamlEntry } from "./projectYamlCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import { createProjectValidationWorkerPool } from "./projectValidationWorkerPool"
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
      memberIndexEntries: objectTableSnapshot.memberIndexEntries ?? [],
      pendingReferences: objectTableSnapshot.pendingReferences ?? [],
    })
    const cache = createProjectYamlCacheFromEntries([...entries.values()])
    const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir, table: objectTable })
    const metadataResolver = createProjectMetadataResolverFromValidationTable({
      projectDir,
      table: objectTable,
      mode: queue.mode,
      ownerCache,
      yamlCache: cache,
    })
    const referenceResult = validatePendingReferences({
      snapshot: referenceSnapshot,
      references: referenceSnapshot.pendingReferences,
      resolver: metadataResolver,
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
      const metadataResolver = createProjectMetadataResolverFromValidationTable({
        projectDir,
        table: objectTable,
        mode: queue.mode,
        ownerCache,
        yamlCache: cache,
      })
      const second = validateProjectFileSecondPass({
        projectDir,
        state,
        cache,
        context,
        ownerCache,
        metadataResolver,
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
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const files = discoverValidationProjectFiles(projectDir)
  const pool = createProjectValidationWorkerPool({ concurrency: params.concurrency })

  try {
    await pool.start()
    const first = await pool.runFirstPass({ projectDir, context, files })
    const objectTable = createValidationObjectTable()
    objectTable.mergeRecords(first.objectRecords)
    const second = await pool.runSecondPass({
      projectDir,
      context,
      mode: "full",
      objectTable: objectTable.snapshot(),
    })

    return { diagnostics: sortDiagnostics(dedupeDiagnostics([...first.diagnostics, ...second.diagnostics])) }
  } finally {
    await pool.close()
  }
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
  result: ReturnType<typeof validatePendingReferences>
}): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return

  console.error(
    [
      "[validation-profile] references second-pass",
      `hits=${params.result.hits}`,
      `misses=${params.result.misses}`,
      `fallbacks=${params.result.fallbacks}`,
      `snapshotBytes=${params.snapshot.stats.snapshotBytes}`,
      `pending=${params.snapshot.stats.pendingReferences}`,
      `entries=${params.snapshot.stats.memberEntries}`,
    ].join(" ")
  )
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
