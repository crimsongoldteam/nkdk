import { performance } from "node:perf_hooks"
import { resolve } from "path"

// Переходный validation worker. Полная валидация проекта использует preparedYamlProjectWorker.
import type { ConfigurationContext } from "../context/types"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import { getProjectReferenceObjectPathContributor } from "./projectReferenceIndexRegistry"
import type {
  PendingMetadataTargetReference,
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
} from "./projectMetadataReferences"
import { validatePendingReferencesWithIndex } from "./projectReferenceIndex"
import { createSharedProjectReferenceIndex } from "./sharedProjectReferenceIndex"
import type { SharedValidationSnapshot } from "./sharedValidationSnapshot"
import { resolveValidationProjectFile } from "./projectFiles"
import {
  createProjectYamlCache,
  createProjectYamlCacheFromEntries,
  type ProjectYamlCache,
} from "./projectYamlCache"
import {
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
  type ProjectValidationFirstPassProfile,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import { createProjectValidationWorkerSchemaCache } from "./projectValidationWorkerSchemaCache"
import type { ValidationMode, ValidationObjectRecord } from "./projectValidationTypes"
import type { ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"
import { registerValidationMetadata } from "./registerValidationMetadata"

registerValidationMetadata()

export type ValidationWorkerTask =
  | {
      kind: "init"
      context: ConfigurationContext
      rulesSnapshot: ValidationRulesSnapshot
    }
  | {
      kind: "firstPass"
      projectDir: string
      context: ConfigurationContext
      filePaths: string[]
    }
  | {
      kind: "secondPass"
      projectDir: string
      context: ConfigurationContext
      mode: ValidationMode
      sharedValidationSnapshot: SharedValidationSnapshot
      pendingReferences: PendingMetadataTargetReference[]
      filePaths: string[]
    }

export type ValidationWorkerTaskResult =
  | ({ kind: "initResult" } & ValidationSchemaCacheCompileProfile)
  | {
      kind: "firstPassResult"
      diagnostics: Diagnostic[]
      objectRecords: ValidationObjectRecord[]
      objectIndexEntries: ProjectObjectIndexEntry[]
      memberIndexEntries: ProjectMemberIndexEntry[]
      valueIndexEntries: ProjectValueIndexEntry[]
      pendingReferences: PendingMetadataTargetReference[]
      timing?: WorkerFirstPassTiming
      profile?: WorkerFirstPassProfile
    }
  | {
      kind: "secondPassResult"
      diagnostics: Diagnostic[]
      timing?: WorkerSecondPassTiming
      profile?: WorkerSecondPassProfile
    }

interface WorkerValidationState {
  states: Map<string, ProjectValidationFileState>
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}

let workerState = createEmptyWorkerValidationState()
let workerSchemaCache: ValidationSchemaCache | undefined
let workerRulesSnapshot: ValidationRulesSnapshot | undefined

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    states: new Map(),
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

export default async function runValidationWorkerTask(
  message: ValidationWorkerTask
): Promise<ValidationWorkerTaskResult> {
  if (message.kind === "init") return { kind: "initResult", ...(await runInit(message)) }
  if (message.kind === "firstPass") return { kind: "firstPassResult", ...runFirstPass(message) }
  return { kind: "secondPassResult", ...runSecondPass(message) }
}

async function runInit(
  message: Extract<ValidationWorkerTask, { kind: "init" }>
): Promise<ValidationSchemaCacheCompileProfile> {
  workerSchemaCache = await createProjectValidationWorkerSchemaCache({ context: message.context })
  workerRulesSnapshot = message.rulesSnapshot
  return workerSchemaCache.compileAll()
}

function runFirstPass(message: Extract<ValidationWorkerTask, { kind: "firstPass" }>): {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  timing?: WorkerFirstPassTiming
  profile?: WorkerFirstPassProfile
} {
  workerState = createEmptyWorkerValidationState()
  const diagnostics: Diagnostic[] = []
  const objectRecords: ValidationObjectRecord[] = []
  const schemaCache = requireWorkerSchemaCache()
  const timing = createWorkerFirstPassTiming()
  const profile = createWorkerFirstPassProfile()

  for (const filePath of message.filePaths) {
    const file = resolveValidationProjectFile(message.projectDir, filePath)
    if (file === undefined) {
      diagnostics.push(unrecognizedFileDiagnostic(filePath))
      continue
    }

    const readStartedAt = performance.now()
    const entry = readProjectYamlEntryForValidation(file.absolutePath)
    timing?.recordRead(performance.now() - readStartedAt)
    if ("error" in entry) {
      diagnostics.push(readProjectYamlDiagnostic(entry))
      continue
    }

    const cache = createProjectYamlCacheFromEntries([entry])
    const firstPassStartedAt = performance.now()
    const first = validateProjectFileFirstPass({
      projectDir: message.projectDir,
      file,
      cache,
      context: message.context,
      schemaCache,
      rulesSnapshot: requireWorkerRulesSnapshot(),
    })
    const firstPassMs = performance.now() - firstPassStartedAt
    timing?.recordFirstPass(firstPassMs)
    profile?.record(file.absolutePath, firstPassMs, first)
    workerState.states.set(resolve(file.absolutePath), first.state)
    workerState.objectIndexEntries.push(...first.objectIndexEntries)
    workerState.memberIndexEntries.push(...first.memberIndexEntries)
    workerState.valueIndexEntries.push(...first.valueIndexEntries)
    workerState.pendingReferences.push(...first.pendingReferences)
    diagnostics.push(...first.diagnostics)
    objectRecords.push(...first.objectRecords)
    timing?.recordMemory()
  }

  return {
    diagnostics,
    objectRecords,
    objectIndexEntries: workerState.objectIndexEntries,
    memberIndexEntries: workerState.memberIndexEntries,
    valueIndexEntries: workerState.valueIndexEntries,
    pendingReferences: workerState.pendingReferences,
    ...(timing === undefined ? {} : { timing: timing.snapshot(message.filePaths.length) }),
    ...(profile === undefined ? {} : { profile: profile.snapshot() }),
  }
}

function requireWorkerSchemaCache(): ValidationSchemaCache {
  if (workerSchemaCache === undefined) {
    throw new Error("Validation worker не инициализирован")
  }
  return workerSchemaCache
}

function requireWorkerRulesSnapshot(): ValidationRulesSnapshot {
  if (workerRulesSnapshot === undefined) {
    throw new Error("Validation worker rulesSnapshot не инициализирован")
  }
  return workerRulesSnapshot
}

function runSecondPass(message: Extract<ValidationWorkerTask, { kind: "secondPass" }>): {
  diagnostics: Diagnostic[]
  timing?: WorkerSecondPassTiming
  profile?: WorkerSecondPassProfile
} {
  const diagnostics: Diagnostic[] = []
  const profile = createWorkerSecondPassProfile()
  const timing = createWorkerSecondPassTiming()
  const cache = createWorkerYamlCache()
  const ownerCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: message.projectDir,
    snapshot: message.sharedValidationSnapshot,
  })
  timing?.markContextEnd()
  const referenceIndex = createSharedProjectReferenceIndex({
    projectDir: message.projectDir,
    mode: message.mode,
    snapshot: message.sharedValidationSnapshot.reference,
    resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir: message.projectDir, target }),
  })
  const referenceResult = validatePendingReferencesWithIndex({
    index: referenceIndex,
    references: message.pendingReferences,
  })
  diagnostics.push(...referenceResult.diagnostics)
  timing?.markReferenceEnd()

  for (const filePath of message.filePaths) {
    const state = workerState.states.get(resolve(filePath))
    if (state === undefined) continue
    const fileStartedAt = profile === undefined ? 0 : performance.now()
    const second = validateProjectFileSecondPass({
      projectDir: message.projectDir,
      state,
      cache,
      context: message.context,
      ownerCache,
      referenceIndex,
      skipMetadataTargetValidation: true,
    })
    if (profile !== undefined) profile.record(state, performance.now() - fileStartedAt, second.diagnostics.length)
    diagnostics.push(...second.diagnostics)
    timing?.recordMemory()
  }

  workerState = createEmptyWorkerValidationState()

  return {
    diagnostics,
    ...(timing === undefined
      ? {}
      : {
          timing: timing.snapshot({
            fileCount: message.filePaths.length,
            referenceResult,
            snapshotBytes: message.sharedValidationSnapshot.reference.stats.snapshotBytes,
            pendingReferences: message.pendingReferences.length,
            memberIndexEntries: message.sharedValidationSnapshot.reference.stats.memberEntries,
          }),
        }),
    ...(profile === undefined ? {} : { profile: profile.snapshot() }),
  }
}

function resolveObjectFilePath(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}): string | undefined {
  const contributor = getProjectReferenceObjectPathContributor(params.target.root)
  return contributor?.({ projectDir: params.projectDir, target: params.target })?.filePath
}

interface WorkerSecondPassProfile {
  byKind: Array<{
    key: string
    count: number
    diagnostics: number
    totalMs: number
    maxMs: number
  }>
  slowFiles: Array<{
    filePath: string
    key: string
    diagnostics: number
    ms: number
  }>
}

interface WorkerFirstPassTiming {
  readMs: number
  firstPassMs: number
  fileCount: number
  memory: WorkerMemoryTiming
}

interface WorkerSecondPassTiming {
  contextMs: number
  referenceValidationMs: number
  validationMs: number
  fileCount: number
  referenceHits: number
  referenceMisses: number
  referenceConflicts: number
  referenceFilterFailures: number
  referenceDependencies: number
  referenceUnsupported: number
  referenceFallbacks: number
  snapshotBytes: number
  pendingReferences: number
  memberIndexEntries: number
  memory: WorkerMemoryTiming
}

interface WorkerMemoryTiming {
  startRssMb: number
  endRssMb: number
  peakRssMb: number
  startHeapUsedMb: number
  endHeapUsedMb: number
  peakHeapUsedMb: number
}

interface WorkerFirstPassProfile {
  byKind: Array<ProjectValidationFirstPassProfile & { count: number; maxMs: number }>
  slowFiles: Array<{
    filePath: string
    key: string
    diagnostics: number
    ms: number
  }>
}

function createWorkerFirstPassTiming():
  | {
      recordRead(ms: number): void
      recordFirstPass(ms: number): void
      recordMemory(): void
      snapshot(fileCount: number): WorkerFirstPassTiming
    }
  | undefined {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1" && process.env["NKDK_VALIDATION_PROFILE"] !== "1") return undefined

  let readMs = 0
  let firstPassMs = 0
  const memory = createWorkerMemoryTiming()

  return {
    recordRead(ms) {
      readMs += ms
    },
    recordFirstPass(ms) {
      firstPassMs += ms
    },
    recordMemory() {
      memory.record()
    },
    snapshot(fileCount) {
      return { readMs, firstPassMs, fileCount, memory: memory.snapshot() }
    },
  }
}

function createWorkerSecondPassTiming():
  | {
      markContextEnd(): void
      markReferenceEnd(): void
      recordMemory(): void
      snapshot(params: {
        fileCount: number
        referenceResult: ReturnType<typeof validatePendingReferencesWithIndex>
        snapshotBytes: number
        pendingReferences: number
        memberIndexEntries: number
      }): WorkerSecondPassTiming
    }
  | undefined {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1" && process.env["NKDK_VALIDATION_PROFILE"] !== "1") return undefined

  const contextStartedAt = performance.now()
  let referenceStartedAt = contextStartedAt
  let validationStartedAt = contextStartedAt
  const memory = createWorkerMemoryTiming()

  return {
    markContextEnd() {
      referenceStartedAt = performance.now()
    },
    markReferenceEnd() {
      validationStartedAt = performance.now()
    },
    recordMemory() {
      memory.record()
    },
    snapshot(params) {
      const validationEndedAt = performance.now()
      return {
        contextMs: referenceStartedAt - contextStartedAt,
        referenceValidationMs: validationStartedAt - referenceStartedAt,
        validationMs: validationEndedAt - validationStartedAt,
        fileCount: params.fileCount,
        referenceHits: params.referenceResult.stats.hits,
        referenceMisses: params.referenceResult.stats.misses,
        referenceConflicts: params.referenceResult.stats.conflicts,
        referenceFilterFailures: params.referenceResult.stats.filterFailures,
        referenceDependencies: params.referenceResult.stats.dependencies,
        referenceUnsupported: params.referenceResult.stats.unsupported,
        referenceFallbacks: params.referenceResult.stats.fallbacks,
        snapshotBytes: params.snapshotBytes,
        pendingReferences: params.pendingReferences,
        memberIndexEntries: params.memberIndexEntries,
        memory: memory.snapshot(),
      }
    },
  }
}

function createWorkerMemoryTiming(): {
  record(): void
  snapshot(): WorkerMemoryTiming
} {
  const start = readWorkerMemory()
  let end = start
  let peakRssMb = start.rssMb
  let peakHeapUsedMb = start.heapUsedMb

  function record(): void {
    end = readWorkerMemory()
    peakRssMb = Math.max(peakRssMb, end.rssMb)
    peakHeapUsedMb = Math.max(peakHeapUsedMb, end.heapUsedMb)
  }

  return {
    record,
    snapshot() {
      record()
      return {
        startRssMb: start.rssMb,
        endRssMb: end.rssMb,
        peakRssMb,
        startHeapUsedMb: start.heapUsedMb,
        endHeapUsedMb: end.heapUsedMb,
        peakHeapUsedMb,
      }
    },
  }
}

function readWorkerMemory(): { rssMb: number; heapUsedMb: number } {
  const memory = process.memoryUsage()
  return {
    // In worker threads rss is process-wide; heapUsed belongs to the current worker isolate.
    rssMb: memory.rss / 1024 / 1024,
    heapUsedMb: memory.heapUsed / 1024 / 1024,
  }
}

function createWorkerFirstPassProfile():
  | {
      record(filePath: string, ms: number, result: { diagnostics: Diagnostic[]; profile?: ProjectValidationFirstPassProfile }): void
      snapshot(): WorkerFirstPassProfile
    }
  | undefined {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return undefined

  const byKind = new Map<string, ProjectValidationFirstPassProfile & { count: number; maxMs: number }>()
  const slowFiles: WorkerFirstPassProfile["slowFiles"] = []

  return {
    record(filePath, ms, result) {
      const item = result.profile ?? {
        ...emptyWorkerFirstPassProfile("unknown"),
        totalMs: ms,
        diagnostics: result.diagnostics.length,
      }
      const current = byKind.get(item.key) ?? { ...emptyWorkerFirstPassProfile(item.key), count: 0, maxMs: 0 }
      current.count += 1
      current.totalMs += item.totalMs
      current.cacheMs += item.cacheMs
      current.schemaMs += item.schemaMs
      current.validatorsMs += item.validatorsMs
      current.importMs += item.importMs
      current.equalNameMs += item.equalNameMs
      current.uniqueScopesMs += item.uniqueScopesMs
      current.referencesMs += item.referencesMs
      current.fieldIndexMs += item.fieldIndexMs
      current.objectIndexMs += item.objectIndexMs
      current.memberIndexMs += item.memberIndexMs
      current.valueIndexMs += item.valueIndexMs
      current.formImportMs += item.formImportMs
      current.diagnostics += item.diagnostics
      current.maxMs = Math.max(current.maxMs, item.totalMs)
      byKind.set(item.key, current)

      slowFiles.push({ filePath, key: item.key, diagnostics: result.diagnostics.length, ms })
      slowFiles.sort((left, right) => right.ms - left.ms)
      slowFiles.length = Math.min(slowFiles.length, 10)
    },
    snapshot() {
      return {
        byKind: [...byKind.values()].sort((left, right) => right.totalMs - left.totalMs),
        slowFiles: [...slowFiles],
      }
    },
  }
}

function emptyWorkerFirstPassProfile(key: string): ProjectValidationFirstPassProfile {
  return {
    key,
    totalMs: 0,
    cacheMs: 0,
    schemaMs: 0,
    validatorsMs: 0,
    importMs: 0,
    equalNameMs: 0,
    uniqueScopesMs: 0,
    referencesMs: 0,
    fieldIndexMs: 0,
    objectIndexMs: 0,
    memberIndexMs: 0,
    valueIndexMs: 0,
    formImportMs: 0,
    diagnostics: 0,
  }
}

function createWorkerSecondPassProfile():
  | {
      record(state: ProjectValidationFileState, ms: number, diagnostics: number): void
      snapshot(): WorkerSecondPassProfile
    }
  | undefined {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return undefined

  const byKind = new Map<string, { count: number; diagnostics: number; totalMs: number; maxMs: number }>()
  const slowFiles: WorkerSecondPassProfile["slowFiles"] = []

  return {
    record(state, ms, diagnostics) {
      const key = validationProfileKey(state)
      const current = byKind.get(key) ?? { count: 0, diagnostics: 0, totalMs: 0, maxMs: 0 }
      current.count += 1
      current.diagnostics += diagnostics
      current.totalMs += ms
      current.maxMs = Math.max(current.maxMs, ms)
      byKind.set(key, current)

      slowFiles.push({ filePath: state.file.absolutePath, key, diagnostics, ms })
      slowFiles.sort((left, right) => right.ms - left.ms)
      slowFiles.length = Math.min(slowFiles.length, 10)
    },
    snapshot() {
      return {
        byKind: [...byKind.entries()]
          .map(([key, value]) => ({ key, ...value }))
          .sort((left, right) => right.totalMs - left.totalMs),
        slowFiles: [...slowFiles],
      }
    },
  }
}

function validationProfileKey(state: ProjectValidationFileState): string {
  if (state.kind === "failed") return "failed"
  if (state.kind === "form") return "form"
  return `properties:${state.file.owner.dir}`
}

function createWorkerYamlCache(): ProjectYamlCache {
  return createProjectYamlCache()
}

function unrecognizedFileDiagnostic(filePath: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "external-file",
    message: "Не удалось распознать YAML-файл для validation",
  }
}

export function workerStateStatsForTests(): {
  retainedEntries: number
  retainedStates: number
  retainedPropertyModels: number
  retainedFormStates: number
} {
  const states = [...workerState.states.values()]
  return {
    retainedEntries: 0,
    retainedStates: workerState.states.size,
    retainedPropertyModels: states.filter((state) => state.kind === "properties" && "model" in state).length,
    retainedFormStates: states.filter((state) => state.kind === "form" && "formState" in state).length,
  }
}
