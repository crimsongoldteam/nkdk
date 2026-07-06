import { performance } from "node:perf_hooks"
import { parentPort } from "node:worker_threads"
import { resolve } from "path"
import type { ConfigurationContext } from "../context/types"
import { registerCoreMetadata } from "../register"
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
  type ProjectYamlEntry,
} from "./projectYamlCache"
import {
  createValidationSchemaCache,
  readProjectYamlDiagnostic,
  readProjectYamlEntryForValidation,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
  type ProjectValidationFirstPassProfile,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import type { ValidationMode, ValidationObjectRecord } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

registerCoreMetadata()

type ValidationWorkerMessage =
  | {
      id: number
      kind: "init"
      context: ConfigurationContext
    }
  | {
      id: number
      kind: "firstPass"
      projectDir: string
      context: ConfigurationContext
      filePaths: string[]
    }
  | {
      id: number
      kind: "secondPass"
      projectDir: string
      context: ConfigurationContext
      mode: ValidationMode
      sharedValidationSnapshot: SharedValidationSnapshot
      pendingReferences: PendingMetadataTargetReference[]
      filePaths: string[]
    }

interface WorkerValidationState {
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}

let workerState = createEmptyWorkerValidationState()
let workerSchemaCache: ValidationSchemaCache | undefined

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    entries: new Map(),
    states: new Map(),
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

parentPort?.on("message", (message: ValidationWorkerMessage) => {
  try {
    if (message.kind === "init") {
      parentPort?.postMessage({ id: message.id, kind: "initResult", ...runInit(message) })
      return
    }

    if (message.kind === "firstPass") {
      parentPort?.postMessage({ id: message.id, kind: "firstPassResult", ...runFirstPass(message) })
      return
    }

    parentPort?.postMessage({ id: message.id, kind: "secondPassResult", ...runSecondPass(message) })
  } catch (caught) {
    parentPort?.postMessage({
      id: message.id,
      kind: "error",
      message: caught instanceof Error ? caught.message : String(caught),
    })
  }
})

function runInit(message: Extract<ValidationWorkerMessage, { kind: "init" }>): ValidationSchemaCacheCompileProfile {
  workerSchemaCache = createValidationSchemaCache(message.context)
  return workerSchemaCache.compileAll()
}

function runFirstPass(message: Extract<ValidationWorkerMessage, { kind: "firstPass" }>): {
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

    workerState.entries.set(resolve(entry.filePath), entry)
    const cache = createProjectYamlCacheFromEntries([entry])
    const firstPassStartedAt = performance.now()
    const first = validateProjectFileFirstPass({
      projectDir: message.projectDir,
      file,
      cache,
      context: message.context,
      schemaCache,
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

function runSecondPass(message: Extract<ValidationWorkerMessage, { kind: "secondPass" }>): {
  diagnostics: Diagnostic[]
  timing: {
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
  }
  profile?: WorkerSecondPassProfile
} {
  const contextStartedAt = performance.now()
  const diagnostics: Diagnostic[] = []
  const profile = createWorkerSecondPassProfile()
  const cache = createWorkerYamlCache()
  const ownerCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: message.projectDir,
    snapshot: message.sharedValidationSnapshot,
  })
  const referenceStartedAt = performance.now()
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
  const validationStartedAt = performance.now()

  for (const filePath of message.filePaths) {
    const state = workerState.states.get(resolve(filePath))
    if (state === undefined) continue
    const fileStartedAt = performance.now()
    const second = validateProjectFileSecondPass({
      projectDir: message.projectDir,
      state,
      cache,
      context: message.context,
      ownerCache,
      referenceIndex,
      skipMetadataTargetValidation: true,
    })
    profile?.record(state, performance.now() - fileStartedAt, second.diagnostics.length)
    diagnostics.push(...second.diagnostics)
  }

  return {
    diagnostics,
    timing: {
      contextMs: referenceStartedAt - contextStartedAt,
      referenceValidationMs: validationStartedAt - referenceStartedAt,
      validationMs: performance.now() - validationStartedAt,
      fileCount: message.filePaths.length,
      referenceHits: referenceResult.stats.hits,
      referenceMisses: referenceResult.stats.misses,
      referenceConflicts: referenceResult.stats.conflicts,
      referenceFilterFailures: referenceResult.stats.filterFailures,
      referenceDependencies: referenceResult.stats.dependencies,
      referenceUnsupported: referenceResult.stats.unsupported,
      referenceFallbacks: referenceResult.stats.fallbacks,
      snapshotBytes: message.sharedValidationSnapshot.reference.stats.snapshotBytes,
      pendingReferences: message.pendingReferences.length,
      memberIndexEntries: message.sharedValidationSnapshot.reference.stats.memberEntries,
    },
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
      snapshot(fileCount: number): WorkerFirstPassTiming
    }
  | undefined {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1" && process.env["NKDK_VALIDATION_PROFILE"] !== "1") return undefined

  let readMs = 0
  let firstPassMs = 0

  return {
    recordRead(ms) {
      readMs += ms
    },
    recordFirstPass(ms) {
      firstPassMs += ms
    },
    snapshot(fileCount) {
      return { readMs, firstPassMs, fileCount }
    },
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
  const local = createProjectYamlCacheFromEntries([...workerState.entries.values()])
  const fallback = createProjectYamlCache()

  return {
    get(filePath) {
      const entry = local.get(filePath)
      if (!("error" in entry) || !entry.error.message.startsWith("YAML-файл отсутствует в validation snapshot")) {
        return entry
      }
      return fallback.get(filePath)
    },
    release(filePath) {
      local.release(filePath)
      fallback.release(filePath)
    },
  }
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
