import { dirname, join } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"
import Piscina from "piscina"
import type { ConfigurationContext } from "../context/types"
import type {
  FirstPassPoolResult,
  SecondPassPoolParams,
  SecondPassPoolResult,
  ValidationWorkerPoolStartProfile,
} from "../validation/validationWorkerPoolTypes"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import type { Diagnostic } from "../validation/types"
import { createValidationSnapshotProvider } from "../validation/validationSnapshotProvider"
import type {
  PreparedGlobalMetadataIndex,
  PreparedMetadataDeclaration,
  PreparedYamlProjectFileDescriptor,
  PreparedYamlWorkerPartition,
} from "./preparedYamlProject"
import runPreparedYamlProjectWorkerTask, {
  type PreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTaskResult,
} from "./preparedYamlProjectWorker"

export interface PreparedYamlProjectWorkerPool {
  run(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
  }): Promise<PreparedYamlProjectWorkerPoolResult>
  initValidation(context: ConfigurationContext): Promise<ValidationWorkerPoolStartProfile>
  runValidationFirstPass(params: { projectDir: string; context: ConfigurationContext }): Promise<FirstPassPoolResult>
  runValidationSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
  close(): Promise<void>
  size(): number
}

export interface PreparedYamlProjectWorkerPoolResult {
  diagnostics: Diagnostic[]
  metadataIndex: PreparedGlobalMetadataIndex
  workers: PreparedYamlWorkerPartition[]
}

type PreparedMetadataDeclarationMergeResult =
  | { ok: true; index: PreparedGlobalMetadataIndex }
  | { ok: false; code: "declaration_conflict"; message: string; diagnostics: Diagnostic[] }

type PreparedWorkerPool = Pick<Piscina, "run" | "destroy">

export function createPreparedYamlProjectWorkerPool(params: {
  concurrency: number
  createWorkerPool?: () => PreparedWorkerPool
}): PreparedYamlProjectWorkerPool {
  const pools = new Map<number, PreparedWorkerPool>()
  const createPool = params.createWorkerPool ?? createWorkerPool
  const activeWorkerIndexes = new Set<number>()
  const initializedValidationWorkerIndexes = new Set<number>()
  let validationStartProfile: ValidationWorkerPoolStartProfile | undefined

  return {
    async run(runParams) {
      const partitions = partitionRoundRobin(runParams.files, params.concurrency)
      activeWorkerIndexes.clear()
      const itemTypeByYamlDir = Object.fromEntries(
        runParams.files.map((file) => [file.owner.dir, file.itemType]).filter(([dir]) => dir.length > 0)
      )
      const results = await Promise.all(
        partitions.map(async (files, index): Promise<PreparedYamlProjectWorkerPoolResult & { workerIndex: number }> => {
          if (files.length === 0) {
            return {
              workerIndex: index,
              diagnostics: [],
              metadataIndex: { declarations: [] },
              workers: [
                {
                  workerIndex: index,
                  yamlFiles: [],
                  dependencyIndex: { dependencies: [] },
                },
              ],
            }
          }
          activeWorkerIndexes.add(index)

          const task = {
            kind: "prepare",
            projectDir: runParams.projectDir,
            itemTypeByYamlDir,
            files,
          } satisfies PreparedYamlProjectWorkerTask
          const response =
            params.concurrency === 1 && params.createWorkerPool === undefined
              ? await runPreparedYamlProjectWorkerTask(task)
              : ((await getOrCreatePool(pools, index, createPool).run(task)) as PreparedYamlProjectWorkerTaskResult)
          if (response.kind !== "prepareResult") throw new Error("Worker вернул неожиданный результат prepare")
          return {
            workerIndex: index,
            diagnostics: response.diagnostics,
            metadataIndex: { declarations: response.declarations },
            workers: [
              {
                workerIndex: index,
                yamlFiles: response.yamlFiles,
                dependencyIndex: { dependencies: response.dependencies },
              },
            ],
          }
        })
      )
      const mergedDeclarations = mergePreparedMetadataDeclarationsForTests(
        results.flatMap((result) => result.metadataIndex.declarations)
      )
      if (!mergedDeclarations.ok) {
        return {
          diagnostics: mergedDeclarations.diagnostics,
          metadataIndex: { declarations: [] },
          workers: results.flatMap((result) => result.workers),
        }
      }
      const workers = redistributeDependenciesBySourceFile(results.flatMap((result) => result.workers))
      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        metadataIndex: mergedDeclarations.index,
        workers,
      }
    },
    async initValidation(context) {
      const indexesToInit = Array.from(activeWorkerIndexes).filter((index) => !initializedValidationWorkerIndexes.has(index))
      if (indexesToInit.length === 0 && validationStartProfile !== undefined) {
        return { ...validationStartProfile, reused: true }
      }

      const rulesSnapshot = createValidationRulesSnapshot(context)
      const startedAt = performance.now()
      const results = await Promise.all(
        indexesToInit.map(async (index) => {
          const task = { kind: "initValidation", context, rulesSnapshot } satisfies PreparedYamlProjectWorkerTask
          const response =
            params.concurrency === 1 && params.createWorkerPool === undefined
              ? await runPreparedYamlProjectWorkerTask(task)
              : ((await getOrCreatePool(pools, index, createPool).run(task)) as PreparedYamlProjectWorkerTaskResult)
          if (response.kind !== "initValidationResult") throw new Error("Worker вернул неожиданный результат initValidation")
          return response
        })
      )

      for (const index of indexesToInit) initializedValidationWorkerIndexes.add(index)
      const startProfile = {
        workerInitMs: performance.now() - startedAt,
        schemaCompileMs: results.reduce((sum, result) => sum + result.totalMs, 0),
        formSchemaMs: results.reduce((sum, result) => sum + result.formMs, 0),
        propertiesSchemaMs: results.reduce((sum, result) => sum + result.propertiesMs, 0),
        rulesSnapshotBytes: JSON.stringify(rulesSnapshot).length,
      }
      validationStartProfile =
        validationStartProfile === undefined
          ? startProfile
          : {
              workerInitMs: validationStartProfile.workerInitMs + startProfile.workerInitMs,
              schemaCompileMs: validationStartProfile.schemaCompileMs + startProfile.schemaCompileMs,
              formSchemaMs: validationStartProfile.formSchemaMs + startProfile.formSchemaMs,
              propertiesSchemaMs: validationStartProfile.propertiesSchemaMs + startProfile.propertiesSchemaMs,
              rulesSnapshotBytes: startProfile.rulesSnapshotBytes,
            }
      return validationStartProfile
    },
    async runValidationFirstPass(firstPassParams) {
      const results = await Promise.all(
        Array.from(activeWorkerIndexes).map(async (index) => {
          const task = {
            kind: "validateFirstPass",
            projectDir: firstPassParams.projectDir,
            context: firstPassParams.context,
          } satisfies PreparedYamlProjectWorkerTask
          const response =
            params.concurrency === 1 && params.createWorkerPool === undefined
              ? await runPreparedYamlProjectWorkerTask(task)
              : ((await getOrCreatePool(pools, index, createPool).run(task)) as PreparedYamlProjectWorkerTaskResult)
          if (response.kind !== "validateFirstPassResult") {
            throw new Error("Worker вернул неожиданный результат validateFirstPass")
          }
          return response
        })
      )

      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        objectRecords: results.flatMap((result) => result.objectRecords),
        objectIndexEntries: results.flatMap((result) => result.objectIndexEntries),
        memberIndexEntries: results.flatMap((result) => result.memberIndexEntries),
        valueIndexEntries: results.flatMap((result) => result.valueIndexEntries),
        pendingReferences: results.flatMap((result) => result.pendingReferences),
      }
    },
    async runValidationSecondPass(secondPassParams) {
      const activeIndexes = Array.from(activeWorkerIndexes)
      if (activeIndexes.length === 0) return { diagnostics: [] }

      const provider = createValidationSnapshotProvider(secondPassParams.objectTable)
      const sharedValidationSnapshot = provider.sharedPayload()
      const referencePartitions = partitionRoundRobin(secondPassParams.objectTable.pendingReferences ?? [], activeIndexes.length)
      const results = await Promise.all(
        activeIndexes.map(async (index, partitionIndex) => {
          const task = {
            kind: "validateSecondPass",
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            sharedValidationSnapshot,
            pendingReferences: referencePartitions[partitionIndex] ?? [],
          } satisfies PreparedYamlProjectWorkerTask
          const response =
            params.concurrency === 1 && params.createWorkerPool === undefined
              ? await runPreparedYamlProjectWorkerTask(task)
              : ((await getOrCreatePool(pools, index, createPool).run(task)) as PreparedYamlProjectWorkerTaskResult)
          if (response.kind !== "validateSecondPassResult") {
            throw new Error("Worker вернул неожиданный результат validateSecondPass")
          }
          return response
        })
      )

      return { diagnostics: results.flatMap((result) => result.diagnostics) }
    },
    async close() {
      await Promise.all([...pools.values()].map((pool) => pool.destroy()))
      pools.clear()
      activeWorkerIndexes.clear()
      initializedValidationWorkerIndexes.clear()
      validationStartProfile = undefined
    },
    size() {
      return params.concurrency
    },
  }
}

function getOrCreatePool(
  pools: Map<number, PreparedWorkerPool>,
  index: number,
  createPool: () => PreparedWorkerPool
): PreparedWorkerPool {
  const existing = pools.get(index)
  if (existing !== undefined) return existing

  const pool = createPool()
  pools.set(index, pool)
  return pool
}

export function mergePreparedMetadataDeclarationsForTests(
  declarations: readonly PreparedMetadataDeclaration[]
): PreparedMetadataDeclarationMergeResult {
  const byCanonical = new Map<string, PreparedMetadataDeclaration>()
  for (const declaration of declarations) {
    const existing = byCanonical.get(declaration.canonical)
    if (existing !== undefined) {
      return {
        ok: false,
        code: "declaration_conflict",
        message: `Повторное объявление metadata: ${declaration.canonical}`,
        diagnostics: [
          {
            filePath: declaration.filePath,
            line: 1,
            col: 1,
            severity: "error",
            source: "reference",
            message: `Повторное объявление metadata: ${declaration.canonical}`,
          },
        ],
      }
    }
    byCanonical.set(declaration.canonical, declaration)
  }

  return { ok: true, index: { declarations: [...byCanonical.values()] } }
}

function redistributeDependenciesBySourceFile(
  workers: readonly PreparedYamlWorkerPartition[]
): PreparedYamlWorkerPartition[] {
  const ownerWorkerByProjectPath = new Map<string, number>()
  const dependencies = workers.flatMap((worker) => worker.dependencyIndex.dependencies)
  for (const worker of workers) {
    for (const file of worker.yamlFiles) ownerWorkerByProjectPath.set(file.projectPath, worker.workerIndex)
  }

  return workers.map((worker) => ({
    ...worker,
    dependencyIndex: {
      dependencies: dependencies.filter(
        (dependency) => ownerWorkerByProjectPath.get(dependency.sourceProjectPath) === worker.workerIndex
      ),
    },
  }))
}

function createWorkerPool(): Piscina {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = join(dirname(currentFile), "preparedYamlProjectWorker.ts")
  return new Piscina({
    filename: workerFile,
    minThreads: 1,
    maxThreads: 1,
    execArgv: [
      "--import",
      "tsx",
      "--import",
      pathToFileURL(join(dirname(currentFile), "../validation/projectValidationWorkerRegister.mjs")).href,
    ],
  })
}

function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const result = Array.from({ length: count }, () => [] as T[])
  items.forEach((item, index) => result[index % count]?.push(item))
  return result
}
