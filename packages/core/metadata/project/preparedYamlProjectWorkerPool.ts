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
import { createValidationProfiler } from "../validation/profile"
import { ProjectFileSchemaError } from "../validation/projectFileSchema"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import type { Diagnostic } from "../validation/types"
import { createValidationSnapshotProvider } from "../validation/validationSnapshotProvider"
import type {
  PreparedGlobalMetadataIndex,
  PreparedMetadataDeclaration,
  PreparedYamlProjectFileDescriptor,
  PreparedYamlWorkerPartition,
} from "./preparedYamlProject"
import type { PreparedYamlProjectWorkerTask, PreparedYamlProjectWorkerTaskResult } from "./preparedYamlProjectWorker"

export interface PreparedYamlProjectWorkerPool {
  run(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
    includeYamlData?: boolean
  }): Promise<PreparedYamlProjectWorkerPoolResult>
  initValidation(context: ConfigurationContext): Promise<ValidationWorkerPoolStartProfile>
  runValidationFirstPass(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
  }): Promise<FirstPassPoolResult>
  runValidationSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
  runPartialValidation(params: {
    projectDir: string
    filePath: string
    context: ConfigurationContext
  }): Promise<{ diagnostics: Diagnostic[] }>
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

export type PreparedWorkerPool = Pick<Piscina, "run" | "destroy">

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
      const profiler = createValidationProfiler({ scope: "main" })
      const partitions = profiler.measure("Подготовка YAML-проекта", "Разбиение по worker", { items: runParams.files.length }, () =>
        partitionRoundRobin(runParams.files, params.concurrency)
      )
      activeWorkerIndexes.clear()
      const itemTypeByYamlDir = profiler.measure(
        "Подготовка YAML-проекта",
        "Сбор правил структуры проекта",
        { items: runParams.files.length },
        () => Object.fromEntries(runParams.files.map((file) => [file.owner.dir, file.itemType]).filter(([dir]) => dir.length > 0))
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
            workerIndex: index,
            projectDir: runParams.projectDir,
            itemTypeByYamlDir,
            files,
            includeYamlData: runParams.includeYamlData ?? true,
          } satisfies PreparedYamlProjectWorkerTask
          const response = (await getOrCreatePool(pools, index, createPool).run(
            task
          )) as PreparedYamlProjectWorkerTaskResult
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
      const mergedDeclarations = profiler.measure(
        "Подготовка YAML-проекта",
        "Слияние индекса объявлений",
        { items: results.length },
        () => mergePreparedMetadataDeclarationsForTests(results.flatMap((result) => result.metadataIndex.declarations))
      )
      if (!mergedDeclarations.ok) {
        profiler.flush()
        return {
          diagnostics: mergedDeclarations.diagnostics,
          metadataIndex: { declarations: [] },
          workers: results.flatMap((result) => result.workers),
        }
      }
      const workers = profiler.measure(
        "Подготовка YAML-проекта",
        "Перераспределение индекса обращений",
        { items: results.length },
        () => redistributeDependenciesBySourceFile(results.flatMap((result) => result.workers))
      )
      profiler.flush()
      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        metadataIndex: mergedDeclarations.index,
        workers,
      }
    },
    async initValidation(context) {
      const indexesToInit = Array.from({ length: params.concurrency }, (_, index) => index).filter(
        (index) => !initializedValidationWorkerIndexes.has(index)
      )
      if (indexesToInit.length === 0 && validationStartProfile !== undefined) {
        return { ...validationStartProfile, reused: true }
      }

      const rulesSnapshot = createValidationRulesSnapshot(context)
      const startedAt = performance.now()
      const results = await Promise.all(
        indexesToInit.map(async (index) => {
          const task = { kind: "initValidation", workerIndex: index, context, rulesSnapshot } satisfies PreparedYamlProjectWorkerTask
          const response = (await getOrCreatePool(pools, index, createPool).run(
            task
          )) as PreparedYamlProjectWorkerTaskResult
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
      const partitions = partitionRoundRobin(firstPassParams.files, params.concurrency)
      activeWorkerIndexes.clear()
      const results = await Promise.all(
        partitions.map(async (files, index) => {
          if (files.length === 0) {
            return {
              kind: "validateFirstPassResult" as const,
              diagnostics: [],
              objectRecords: [],
              objectIndexEntries: [],
              memberIndexEntries: [],
              valueIndexEntries: [],
              pendingReferences: [],
              yamlLifetime: { current: 0, max: 0, parsed: 0, propertyEvents: 0 },
            }
          }
          activeWorkerIndexes.add(index)
          const task = {
            kind: "validateFirstPass",
            workerIndex: index,
            projectDir: firstPassParams.projectDir,
            context: firstPassParams.context,
            files,
          } satisfies PreparedYamlProjectWorkerTask
          const response = (await getOrCreatePool(pools, index, createPool).run(
            task
          )) as PreparedYamlProjectWorkerTaskResult
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
        yamlLifetime: {
          current: results.reduce((sum, result) => sum + result.yamlLifetime.current, 0),
          max: Math.max(0, ...results.map((result) => result.yamlLifetime.max)),
          parsed: results.reduce((sum, result) => sum + result.yamlLifetime.parsed, 0),
          propertyEvents: results.reduce((sum, result) => sum + result.yamlLifetime.propertyEvents, 0),
        },
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
            workerIndex: index,
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            sharedValidationSnapshot,
            pendingReferences: referencePartitions[partitionIndex] ?? [],
          } satisfies PreparedYamlProjectWorkerTask
          const response = (await getOrCreatePool(pools, index, createPool).run(
            task
          )) as PreparedYamlProjectWorkerTaskResult
          if (response.kind !== "validateSecondPassResult") {
            throw new Error("Worker вернул неожиданный результат validateSecondPass")
          }
          return response
        })
      )

      return { diagnostics: results.flatMap((result) => result.diagnostics) }
    },
    async runPartialValidation(partialParams) {
      const task = {
        kind: "validatePartial",
        workerIndex: 0,
        projectDir: partialParams.projectDir,
        filePath: partialParams.filePath,
        context: partialParams.context,
      } satisfies PreparedYamlProjectWorkerTask
      let response: PreparedYamlProjectWorkerTaskResult
      try {
        response = (await getOrCreatePool(pools, 0, createPool).run(task)) as PreparedYamlProjectWorkerTaskResult
      } catch (caught) {
        if (isProjectFileSchemaWorkerError(caught)) throw new ProjectFileSchemaError(caught.message)
        throw caught
      }
      if (response.kind !== "validatePartialResult") {
        throw new Error("Worker вернул неожиданный результат validatePartial")
      }
      return { diagnostics: response.diagnostics }
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

function isProjectFileSchemaWorkerError(caught: unknown): caught is Error {
  if (!(caught instanceof Error) || typeof caught.cause !== "object" || caught.cause === null) return false
  return "code" in caught.cause && caught.cause.code === "project_file_schema"
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
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "preparedYamlProjectWorker.ts")
    : join(dirname(currentFile), "preparedYamlProjectWorker.js")
  const execArgv = currentFile.endsWith(".ts")
    ? ["--import", "tsx", "--import", pathToFileURL(join(dirname(currentFile), "../validation/projectValidationWorkerRegister.mjs")).href]
    : []
  return new Piscina({
    filename: workerFile,
    minThreads: 1,
    maxThreads: 1,
    execArgv,
  })
}

function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const result = Array.from({ length: count }, () => [] as T[])
  items.forEach((item, index) => result[index % count]?.push(item))
  return result
}
