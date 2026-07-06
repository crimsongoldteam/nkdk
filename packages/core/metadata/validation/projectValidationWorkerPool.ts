import { dirname, join } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"
import Piscina from "piscina"
import type { ConfigurationContext } from "../context/types"
import {
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectMetadataReferences"
import type { ValidationProjectFile } from "./projectFiles"
import type { ProjectValidationFirstPassProfile } from "./projectValidationPasses"
import type { SharedValidationSnapshot } from "./sharedValidationSnapshot"
import type { ValidationMode, ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"
import { createValidationRulesSnapshot, type ValidationRulesSnapshot } from "./rulesSnapshot"
import type { ValidationWorkerTask, ValidationWorkerTaskResult } from "./projectValidationWorker"

export interface FirstPassPoolParams {
  projectDir: string
  context: ConfigurationContext
  files: readonly ValidationProjectFile[]
}

export interface FirstPassPoolResult {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}

export interface SecondPassPoolParams {
  projectDir: string
  context: ConfigurationContext
  mode: ValidationMode
  objectTable: ValidationObjectTableSnapshot
}

export interface SecondPassPoolResult {
  diagnostics: Diagnostic[]
}

export interface ProjectValidationWorkerPoolStartProfile {
  workerInitMs: number
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  rulesSnapshotBytes: number
  reused?: boolean
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
}

interface WorkerFirstPassTiming {
  readMs: number
  firstPassMs: number
  workerWallMs: number
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

export interface ProjectValidationWorkerPool {
  start(context: ConfigurationContext): Promise<ProjectValidationWorkerPoolStartProfile>
  close(): Promise<void>
  size(): number
  runFirstPass(params: FirstPassPoolParams): Promise<FirstPassPoolResult>
  runSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
}

type WorkerRequest =
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

export function createProjectValidationWorkerPool(params: { concurrency: number }): ProjectValidationWorkerPool {
  let pools: Piscina[] = []
  let startProfile: ProjectValidationWorkerPoolStartProfile | undefined
  const assignedFilePathsByPartition = new Map<number, string[]>()

  return {
    async start(context) {
      if (startProfile !== undefined) return { ...startProfile, reused: true }
      while (pools.length < params.concurrency) pools.push(createWorkerPool())
      const rulesSnapshot = createValidationRulesSnapshot(context)
      const startedAt = performance.now()
      const results = await Promise.all(
        pools.map(async (pool) => {
          const response = await request(pool, { kind: "init", context, rulesSnapshot })
          if (response.kind !== "initResult") throw new Error("Worker вернул неожиданный результат init")
          return response
        })
      )

      startProfile = {
        workerInitMs: performance.now() - startedAt,
        schemaCompileMs: results.reduce((sum, result) => sum + result.totalMs, 0),
        formSchemaMs: results.reduce((sum, result) => sum + result.formMs, 0),
        propertiesSchemaMs: results.reduce((sum, result) => sum + result.propertiesMs, 0),
        rulesSnapshotBytes: JSON.stringify(rulesSnapshot).length,
      }
      return startProfile
    },
    async close() {
      await Promise.all(pools.map((pool) => pool.destroy()))
      pools = []
      startProfile = undefined
      assignedFilePathsByPartition.clear()
    },
    size() {
      return pools.length
    },
    async runFirstPass(firstPassParams) {
      const partitions = partitionRoundRobin(firstPassParams.files, pools.length)
      const results = await Promise.all(
        pools.map(async (pool, index) => {
          const files = partitions[index] ?? []
          const filePaths = files.map((file) => file.absolutePath)
          assignedFilePathsByPartition.set(index, filePaths)
          if (filePaths.length === 0) {
            return {
              index,
              diagnostics: [],
              objectRecords: [],
              objectIndexEntries: [],
              memberIndexEntries: [],
              valueIndexEntries: [],
              pendingReferences: [],
            }
          }

          const requestStartedAt = performance.now()
          const response = await request(pool, {
            kind: "firstPass",
            projectDir: firstPassParams.projectDir,
            context: firstPassParams.context,
            filePaths,
          })
          if (response.kind !== "firstPassResult") throw new Error("Worker вернул неожиданный результат firstPass")
          return {
            index,
            ...response,
            timing:
              response.timing === undefined
                ? undefined
                : { ...response.timing, workerWallMs: performance.now() - requestStartedAt },
          }
        })
      )

      logFirstPassTiming(results)
      logFirstPassProfile(results)

      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        objectRecords: results.flatMap((result) => result.objectRecords),
        objectIndexEntries: results.flatMap((result) => result.objectIndexEntries),
        memberIndexEntries: results.flatMap((result) => result.memberIndexEntries),
        valueIndexEntries: results.flatMap((result) => result.valueIndexEntries),
        pendingReferences: results.flatMap((result) => result.pendingReferences),
      }
    },
    async runSecondPass(secondPassParams) {
      const snapshotStartedAt = performance.now()
      const provider = createValidationSnapshotProvider(secondPassParams.objectTable)
      const sharedValidationSnapshot = provider.sharedPayload()
      const snapshotMs = performance.now() - snapshotStartedAt
      const pendingReferences = secondPassParams.objectTable.pendingReferences ?? []
      const referencePartitions = partitionPendingReferencesForWorkers(pendingReferences, pools.length)
      const requestStartedAt = performance.now()
      const results = await Promise.all(
        pools.map(async (pool, index) => {
          const filePaths = assignedFilePathsByPartition.get(index) ?? []
          if (filePaths.length === 0) return { index, diagnostics: [] }

          const response = await request(pool, {
            kind: "secondPass",
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            sharedValidationSnapshot,
            pendingReferences: referencePartitions[index] ?? [],
            filePaths,
          })
          if (response.kind !== "secondPassResult") throw new Error("Worker вернул неожиданный результат secondPass")
          return { index, ...response }
        })
      )
      logSecondPassPoolProfile({
        snapshotMs,
        workerWallMs: performance.now() - requestStartedAt,
        sharedSnapshotBytes: sharedValidationSnapshot.reference.stats.snapshotBytes,
        sharedOwnerBytes: sharedValidationSnapshot.owners.bytes,
      })

      logSecondPassTiming(results)
      logSecondPassProfile(results)

      return { diagnostics: results.flatMap((result) => result.diagnostics) }
    },
  }
}

function logFirstPassTiming(results: Array<{ index: number; timing?: WorkerFirstPassTiming }>): void {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return

  for (const result of results) {
    if (result.timing === undefined) continue
    console.error(
      [
        `[validation] worker ${result.index} first pass`,
        `files=${result.timing.fileCount}`,
        `read=${result.timing.readMs.toFixed(2)}ms`,
        `firstPass=${result.timing.firstPassMs.toFixed(2)}ms`,
        `wall=${result.timing.workerWallMs.toFixed(2)}ms`,
      ].join(" ")
    )
  }
}

function logFirstPassProfile(
  results: Array<{ index: number; timing?: WorkerFirstPassTiming; profile?: WorkerFirstPassProfile }>
): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return

  const summary = new Map<string, ProjectValidationFirstPassProfile & { count: number; maxMs: number }>()
  const total = results.reduce(
    (current, result) => {
      const timing = result.timing
      if (timing === undefined) return current
      current.files += timing.fileCount
      current.readMs += timing.readMs
      current.firstPassMs += timing.firstPassMs
      current.workerWallMs = Math.max(current.workerWallMs, timing.workerWallMs)
      return current
    },
    { files: 0, readMs: 0, firstPassMs: 0, workerWallMs: 0 }
  )

  console.error(
    [
      "[validation-profile] first pass summary",
      `files=${total.files}`,
      `read=${total.readMs.toFixed(2)}ms`,
      `firstPass=${total.firstPassMs.toFixed(2)}ms`,
      `slowestWorkerWall=${total.workerWallMs.toFixed(2)}ms`,
    ].join(" ")
  )

  for (const result of results) {
    if (result.profile === undefined) continue
    for (const item of result.profile.byKind) {
      const current = summary.get(item.key) ?? { ...emptyFirstPassProfile(item.key), count: 0, maxMs: 0 }
      addFirstPassProfile(current, item)
      summary.set(item.key, current)
    }

    console.error(`[validation-profile] worker ${result.index} first pass slow files`)
    for (const file of result.profile.slowFiles) {
      console.error(
        [
          `[validation-profile] worker ${result.index}`,
          `firstPassMs=${file.ms.toFixed(2)}`,
          `kind=${file.key}`,
          `diagnostics=${file.diagnostics}`,
          `file=${file.filePath}`,
        ].join(" ")
      )
    }
  }

  console.error("[validation-profile] first pass by kind")
  for (const [key, item] of [...summary.entries()].sort((left, right) => right[1].totalMs - left[1].totalMs)) {
    console.error(
      [
        `[validation-profile] kind=${key}`,
        `count=${item.count}`,
        `diagnostics=${item.diagnostics}`,
        `total=${item.totalMs.toFixed(2)}ms`,
        `avg=${(item.totalMs / item.count).toFixed(2)}ms`,
        `max=${item.maxMs.toFixed(2)}ms`,
        `schema=${item.schemaMs.toFixed(2)}ms`,
        `import=${item.importMs.toFixed(2)}ms`,
        `formImport=${item.formImportMs.toFixed(2)}ms`,
        `references=${item.referencesMs.toFixed(2)}ms`,
        `fieldIndex=${item.fieldIndexMs.toFixed(2)}ms`,
        `memberIndex=${item.memberIndexMs.toFixed(2)}ms`,
        `uniqueScopes=${item.uniqueScopesMs.toFixed(2)}ms`,
      ].join(" ")
    )
  }
}

function addFirstPassProfile(
  target: ProjectValidationFirstPassProfile & { count: number; maxMs: number },
  source: ProjectValidationFirstPassProfile & { count: number; maxMs: number }
): void {
  target.count += source.count
  target.totalMs += source.totalMs
  target.cacheMs += source.cacheMs
  target.schemaMs += source.schemaMs
  target.validatorsMs += source.validatorsMs
  target.importMs += source.importMs
  target.equalNameMs += source.equalNameMs
  target.uniqueScopesMs += source.uniqueScopesMs
  target.referencesMs += source.referencesMs
  target.fieldIndexMs += source.fieldIndexMs
  target.objectIndexMs += source.objectIndexMs
  target.memberIndexMs += source.memberIndexMs
  target.valueIndexMs += source.valueIndexMs
  target.formImportMs += source.formImportMs
  target.diagnostics += source.diagnostics
  target.maxMs = Math.max(target.maxMs, source.maxMs)
}

function emptyFirstPassProfile(key: string): ProjectValidationFirstPassProfile & { count: number; maxMs: number } {
  return {
    key,
    count: 0,
    totalMs: 0,
    maxMs: 0,
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

function logSecondPassPoolProfile(params: {
  snapshotMs: number
  workerWallMs: number
  sharedSnapshotBytes?: number
  sharedOwnerBytes?: number
}): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return
  console.error(
    [
      "[validation-profile] second pass orchestration",
      `snapshot=${params.snapshotMs.toFixed(2)}ms`,
      `workerWall=${params.workerWallMs.toFixed(2)}ms`,
      ...(params.sharedSnapshotBytes === undefined ? [] : [`sharedSnapshotBytes=${params.sharedSnapshotBytes}`]),
      ...(params.sharedOwnerBytes === undefined ? [] : [`sharedOwnerBytes=${params.sharedOwnerBytes}`]),
    ].join(" ")
  )
}

function logSecondPassTiming(results: Array<{ index: number; timing?: WorkerSecondPassTiming }>): void {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return

  for (const result of results) {
    if (result.timing === undefined) continue
    console.error(
      [
        `[validation] worker ${result.index} second pass`,
        `files=${result.timing.fileCount}`,
        `context=${result.timing.contextMs.toFixed(2)}ms`,
        `referenceValidation=${result.timing.referenceValidationMs.toFixed(2)}ms`,
        `referenceHits=${result.timing.referenceHits}`,
        `referenceMisses=${result.timing.referenceMisses}`,
        `referenceConflicts=${result.timing.referenceConflicts}`,
        `referenceFilters=${result.timing.referenceFilterFailures}`,
        `referenceDependencies=${result.timing.referenceDependencies}`,
        `referenceUnsupported=${result.timing.referenceUnsupported}`,
        `referenceFallbacks=${result.timing.referenceFallbacks}`,
        `snapshotBytes=${result.timing.snapshotBytes}`,
        `validation=${result.timing.validationMs.toFixed(2)}ms`,
      ].join(" ")
    )
  }
}

function logSecondPassProfile(
  results: Array<{ index: number; timing?: WorkerSecondPassTiming; profile?: WorkerSecondPassProfile }>
): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return

  const summary = new Map<string, { count: number; diagnostics: number; totalMs: number; maxMs: number }>()
  const references = results.reduce(
    (total, result) => {
      const timing = result.timing
      if (timing === undefined) return total
      total.hits += timing.referenceHits
      total.misses += timing.referenceMisses
      total.conflicts += timing.referenceConflicts
      total.filterFailures += timing.referenceFilterFailures
      total.dependencies += timing.referenceDependencies
      total.unsupported += timing.referenceUnsupported
      total.fallbacks += timing.referenceFallbacks
      total.pendingReferences += timing.pendingReferences
      total.snapshotBytes = Math.max(total.snapshotBytes, timing.snapshotBytes)
      total.memberIndexEntries = Math.max(total.memberIndexEntries, timing.memberIndexEntries)
      return total
    },
    {
      hits: 0,
      misses: 0,
      conflicts: 0,
      filterFailures: 0,
      dependencies: 0,
      unsupported: 0,
      fallbacks: 0,
      snapshotBytes: 0,
      pendingReferences: 0,
      memberIndexEntries: 0,
    }
  )

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
      `snapshotBytes=${references.snapshotBytes}`,
      `pending=${references.pendingReferences}`,
      `entries=${references.memberIndexEntries}`,
    ].join(" ")
  )

  for (const result of results) {
    if (result.profile === undefined) continue
    for (const item of result.profile.byKind) {
      const current = summary.get(item.key) ?? { count: 0, diagnostics: 0, totalMs: 0, maxMs: 0 }
      current.count += item.count
      current.diagnostics += item.diagnostics
      current.totalMs += item.totalMs
      current.maxMs = Math.max(current.maxMs, item.maxMs)
      summary.set(item.key, current)
    }

    console.error(`[validation-profile] worker ${result.index} slow files`)
    for (const file of result.profile.slowFiles) {
      console.error(
        [
          `[validation-profile] worker ${result.index}`,
          `ms=${file.ms.toFixed(2)}`,
          `kind=${file.key}`,
          `diagnostics=${file.diagnostics}`,
          `file=${file.filePath}`,
        ].join(" ")
      )
    }
  }

  console.error("[validation-profile] second pass by kind")
  for (const [key, item] of [...summary.entries()].sort((left, right) => right[1].totalMs - left[1].totalMs)) {
    console.error(
      [
        `[validation-profile] kind=${key}`,
        `count=${item.count}`,
        `diagnostics=${item.diagnostics}`,
        `total=${item.totalMs.toFixed(2)}ms`,
        `avg=${(item.totalMs / item.count).toFixed(2)}ms`,
        `max=${item.maxMs.toFixed(2)}ms`,
      ].join(" ")
    )
  }
}

export function partitionPendingReferencesForWorkers(
  references: readonly PendingMetadataTargetReference[],
  count: number
): PendingMetadataTargetReference[][] {
  const partitions = Array.from({ length: count }, () => [] as PendingMetadataTargetReference[])
  references.forEach((reference, index) => partitions[index % count]?.push(reference))
  return partitions
}

function createWorkerPool(): Piscina {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "projectValidationWorker.ts")
    : join(dirname(currentFile), "projectValidationWorker.js")
  const execArgv = workerFile.endsWith(".ts") ? withTypeScriptWorkerLoader(dirname(currentFile)) : process.execArgv

  return new Piscina({
    filename: workerFile,
    minThreads: 1,
    maxThreads: 1,
    execArgv,
  })
}

function withTypeScriptWorkerLoader(workerDir: string): string[] {
  const registerUrl = pathToFileURL(join(workerDir, "projectValidationWorkerRegister.mjs")).href
  return ["--import", "tsx", "--import", registerUrl]
}

async function request(pool: Piscina, message: WorkerRequest): Promise<ValidationWorkerTaskResult> {
  return (await pool.run(message satisfies ValidationWorkerTask)) as ValidationWorkerTaskResult
}

function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const result = Array.from({ length: count }, () => [] as T[])
  items.forEach((item, index) => result[index % count]?.push(item))
  return result
}
