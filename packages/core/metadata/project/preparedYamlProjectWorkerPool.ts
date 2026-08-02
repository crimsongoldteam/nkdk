import { dirname, join } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"
import Piscina, { move, transferableSymbol, valueSymbol } from "piscina"
import type { ConfigurationContext } from "../context/types"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type {
  ComponentFirstPassPoolResult,
  FirstPassPoolResult,
  SecondPassPoolParams,
  SecondPassPoolResult,
  ValidationWorkerPoolStartProfile,
} from "../validation/validationWorkerPoolTypes"
import { createValidationProfiler } from "../validation/profile"
import type { PendingMetadataTargetReference } from "../validation/projectMetadataReferences"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createSharedProjectValidationGraph } from "../validation/sharedValidationSnapshot"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateFileUpdateBatch } from "../projectState/fileUpdate"
import type { ValidationIndexContribution } from "../validation/projectValidationTypes"
import type {
  PreparedGlobalMetadataIndex,
  PreparedMetadataDeclaration,
  PreparedYamlProjectFileDescriptor,
  PreparedYamlWorkerPartition,
} from "./preparedYamlProject"
import {
  LOCAL_VALIDATION_BATCH_SIZE,
  type PreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTaskResult,
} from "./preparedYamlProjectWorker"

export interface PreparedYamlProjectWorkerPool {
  run(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
    includeYamlData?: boolean
  }): Promise<PreparedYamlProjectWorkerPoolResult>
  initValidation(context: ConfigurationContext, signal?: AbortSignal): Promise<ValidationWorkerPoolStartProfile>
  runValidationFirstPass(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
  }): Promise<FirstPassPoolResult>
  runLocalValidation(
    params: {
      projectDir: string
      context: ConfigurationContext
      files: readonly PreparedYamlLocalValidationFile[]
      signal?: AbortSignal
    },
    producer: { writeBatch(batch: ProjectStateFileUpdateBatch): Promise<void> },
  ): Promise<{ readonly diagnostics: readonly Diagnostic[]; readonly parsedYamlFiles: number }>
  runValidationFactPass(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
  }): Promise<ValidationIndexContribution>
  runValidationSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
  close(): Promise<void>
  size(): number
}

export interface PreparedYamlLocalValidationFile {
  readonly descriptor: PreparedYamlProjectFileDescriptor
  readonly bytes: Uint8Array
  readonly hashBytes: Uint8Array
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
    async initValidation(context, signal) {
      signal?.throwIfAborted()
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
            task,
            signal === undefined ? undefined : { signal },
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
              components: [],
              diagnostics: [],
              schemaDiagnostics: [],
              fileResults: [],
              fileUpdateBatches: [],
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

      const components = mergeComponentFirstPassResults(results.flatMap((result) => result.components))
      return {
        components,
        diagnostics: components.flatMap(({ diagnostics }) => diagnostics),
        schemaDiagnostics: components.flatMap(({ schemaDiagnostics }) => schemaDiagnostics),
        fileResults: components.flatMap(({ fileResults }) => fileResults),
        fileUpdateBatches: results.flatMap(({ fileUpdateBatches }) => fileUpdateBatches),
        yamlLifetime: {
          current: results.reduce((sum, result) => sum + result.yamlLifetime.current, 0),
          max: Math.max(0, ...results.map((result) => result.yamlLifetime.max)),
          parsed: results.reduce((sum, result) => sum + result.yamlLifetime.parsed, 0),
          propertyEvents: results.reduce((sum, result) => sum + result.yamlLifetime.propertyEvents, 0),
        },
      }
    },
    async runLocalValidation(localParams, producer) {
      const failureController = new AbortController()
      const signal = localParams.signal === undefined
        ? failureController.signal
        : AbortSignal.any([localParams.signal, failureController.signal])
      await this.initValidation(localParams.context, signal)
      const partitions = partitionRoundRobin(localParams.files, params.concurrency)
      let firstFailure: { readonly reason: unknown } | undefined
      const settled = await Promise.allSettled(partitions.map(async (files, index) => {
        try {
          if (files.length === 0) return { diagnostics: [] as Diagnostic[], parsedYamlFiles: 0 }
          const diagnostics: Diagnostic[] = []
          let parsedYamlFiles = 0
          for (let start = 0; start < files.length; start += LOCAL_VALIDATION_BATCH_SIZE) {
            signal.throwIfAborted()
            const batchFiles = files.slice(start, start + LOCAL_VALIDATION_BATCH_SIZE)
            const hashBytes = new Uint8Array(batchFiles.length * 8)
            batchFiles.forEach((file, fileIndex) => {
              if (file.hashBytes.byteLength !== 8) throw new Error("xxHash64 должен занимать ровно 8 байт")
              hashBytes.set(file.hashBytes, fileIndex * 8)
            })
            const task = {
              kind: "validateLocal" as const,
              workerIndex: index,
              projectDir: localParams.projectDir,
              context: localParams.context,
              files: batchFiles.map(({ descriptor, bytes }) => ({ descriptor, bytes })),
              hashBytes,
            }
            const response = (await getOrCreatePool(pools, index, createPool).run(
              move(localValidationTransferable(task)),
              { signal },
            )) as PreparedYamlProjectWorkerTaskResult
            if (response.kind !== "validateLocalResult") throw new Error("Worker вернул неожиданный результат validateLocal")
            for (const batch of response.fileUpdateBatches) {
              signal.throwIfAborted()
              await producer.writeBatch(batch)
            }
            diagnostics.push(...response.diagnostics)
            parsedYamlFiles += response.parsedYamlFiles
          }
          return { diagnostics, parsedYamlFiles }
        } catch (caught) {
          firstFailure ??= { reason: caught }
          if (!failureController.signal.aborted) failureController.abort(caught)
          throw caught
        }
      }))
      if (firstFailure !== undefined) throw firstFailure.reason
      const results = settled.flatMap((outcome) => outcome.status === "fulfilled" ? [outcome.value] : [])
      return {
        diagnostics: results.flatMap(({ diagnostics }) => diagnostics),
        parsedYamlFiles: results.reduce((sum, { parsedYamlFiles }) => sum + parsedYamlFiles, 0),
      }
    },
    async runValidationFactPass(factPassParams) {
      const rulesSnapshot = createValidationRulesSnapshot(factPassParams.context)
      const partitions = partitionRoundRobin(factPassParams.files, params.concurrency)
      const results = await Promise.all(
        partitions.map(async (files, index): Promise<ValidationIndexContribution> => {
          if (files.length === 0) return emptyValidationIndexContribution()

          const task = {
            kind: "collectValidationFacts",
            workerIndex: index,
            projectDir: factPassParams.projectDir,
            files,
            rulesSnapshot,
          } satisfies PreparedYamlProjectWorkerTask
          const response = (await getOrCreatePool(pools, index, createPool).run(
            task
          )) as PreparedYamlProjectWorkerTaskResult
          if (response.kind !== "collectValidationFactsResult") {
            throw new Error("Worker вернул неожиданный результат collectValidationFacts")
          }
          return response.contribution
        })
      )

      return {
        objectRecords: results.flatMap((result) => result.objectRecords),
        objectIndexEntries: results.flatMap((result) => result.objectIndexEntries),
        memberIndexEntries: results.flatMap((result) => result.memberIndexEntries),
        valueIndexEntries: results.flatMap((result) => result.valueIndexEntries),
        pendingReferences: results.flatMap((result) => result.pendingReferences),
        localDependencies: results.flatMap((result) => result.localDependencies),
        logicalAddresses: results.flatMap((result) => result.logicalAddresses),
      }
    },
    async runValidationSecondPass(secondPassParams) {
      const activeIndexes = Array.from(activeWorkerIndexes)
      if (activeIndexes.length === 0) return { diagnostics: [] }

      const sharedProjectValidationGraph = createSharedProjectValidationGraph(secondPassParams.graph)
      const blocked = new Set(secondPassParams.blockedComponentPaths)
      const referencePartitions = partitionRoundRobin(
        secondPassParams.graph.layers
          .filter(({ componentPath }) => !blocked.has(componentPath))
          .flatMap(({ componentPath, contribution }) =>
            (contribution.pendingReferences ?? []).map((reference) => ({ componentPath, reference }))
          ),
        activeIndexes.length
      )
      const results = await Promise.all(
        activeIndexes.map(async (index, partitionIndex) => {
          const task = {
            kind: "validateSecondPass",
            workerIndex: index,
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            sharedProjectValidationGraph,
            blockedComponentPaths: secondPassParams.blockedComponentPaths,
            pendingReferenceLayers: groupPendingReferencesByComponent(referencePartitions[partitionIndex] ?? []),
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

function localValidationTransferable(
  task: Extract<PreparedYamlProjectWorkerTask, { kind: "validateLocal" }>,
) {
  return {
    get [transferableSymbol]() {
      return [...task.files.map(({ bytes }) => bytes.buffer as ArrayBuffer), task.hashBytes.buffer as ArrayBuffer]
    },
    get [valueSymbol]() {
      return task
    },
  }
}

function mergeComponentFirstPassResults(
  results: readonly ComponentFirstPassPoolResult[]
): ComponentFirstPassPoolResult[] {
  const merged = new Map<string, ComponentFirstPassPoolResult>()
  for (const result of results) {
    const current = merged.get(result.componentPath) ?? emptyComponentFirstPassResult(result.componentPath)
    merged.set(result.componentPath, {
      componentPath: result.componentPath,
      contribution: mergeGraphContributions(current.contribution, result.contribution),
      diagnostics: [...current.diagnostics, ...result.diagnostics],
      schemaDiagnostics: [...current.schemaDiagnostics, ...result.schemaDiagnostics],
      fileResults: [...current.fileResults, ...result.fileResults],
    })
  }
  return [...merged.values()].sort((left, right) => left.componentPath.localeCompare(right.componentPath, "ru"))
}

function emptyComponentFirstPassResult(componentPath: string): ComponentFirstPassPoolResult {
  return {
    componentPath,
    contribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    },
    diagnostics: [],
    schemaDiagnostics: [],
    fileResults: [],
  }
}

function mergeGraphContributions(
  left: ComponentFirstPassPoolResult["contribution"],
  right: ComponentFirstPassPoolResult["contribution"]
): ComponentFirstPassPoolResult["contribution"] {
  return {
    objectRecords: [...left.objectRecords, ...right.objectRecords],
    objectIndexEntries: [...(left.objectIndexEntries ?? []), ...(right.objectIndexEntries ?? [])],
    memberIndexEntries: [...(left.memberIndexEntries ?? []), ...(right.memberIndexEntries ?? [])],
    valueIndexEntries: [...(left.valueIndexEntries ?? []), ...(right.valueIndexEntries ?? [])],
    pendingReferences: [...(left.pendingReferences ?? []), ...(right.pendingReferences ?? [])],
  }
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

function groupPendingReferencesByComponent(
  assignments: readonly {
    componentPath: string
    reference: PendingMetadataTargetReference
  }[]
): Array<{
  componentPath: string
  references: PendingMetadataTargetReference[]
}> {
  const byComponent = new Map<string, PendingMetadataTargetReference[]>()
  for (const { componentPath, reference } of assignments) {
    const references = byComponent.get(componentPath) ?? []
    references.push(reference)
    byComponent.set(componentPath, references)
  }
  return [...byComponent].map(([componentPath, references]) => ({ componentPath, references }))
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
  const validationRegisterUrl = pathToFileURL(
    join(dirname(currentFile), "../validation/projectValidationWorkerRegister.mjs")
  ).href
  const execArgv = currentFile.endsWith(".ts") ? sourceWorkerExecArgv([validationRegisterUrl]) : []
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
