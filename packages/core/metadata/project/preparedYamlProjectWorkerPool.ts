import { dirname, join } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"
import Piscina, { move, transferableSymbol, valueSymbol } from "piscina"
import type { ConfigurationContext } from "../context/types"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type {
  ComponentFirstPassPoolResult,
  FirstPassPoolResult,
  ValidationWorkerPoolStartProfile,
} from "../validation/validationWorkerPoolTypes"
import { createOperationProfiler, createValidationProfiler } from "../validation/profile"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import type { Diagnostic } from "../validation/types"
import { openProjectStateFragment, type ProjectStateFragment } from "../projectState/binary/fragment"
import { assertProjectStateFileBaselinePage } from "../projectState/contracts"
import type { ProjectStateValidationFileBatch } from "../projectState/refresh"
import type { ValidationIndexContribution } from "../validation/projectValidationTypes"
import type {
  PreparedGlobalMetadataIndex,
  PreparedMetadataDeclaration,
  PreparedYamlProjectFileDescriptor,
  PreparedYamlWorkerPartition,
} from "./preparedYamlProject"
import type { MetadataWorkerOperation } from "../workerPool/types"
import type {
  PreparedYamlProjectWorkerTask,
  PreparedYamlProjectWorkerTaskResult,
} from "./preparedYamlProjectWorker"

export interface PreparedYamlProjectWorkerPool {
  run(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
    includeYamlData?: boolean
  }): Promise<PreparedYamlProjectWorkerPoolResult>
  initValidation(
    context: ConfigurationContext,
    operation?: PreparedYamlValidationOperation,
  ): Promise<ValidationWorkerPoolStartProfile>
  runValidationFirstPass(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
  }): Promise<FirstPassPoolResult>
  runProjectStateRefresh(
    params: {
      projectDir: string
      context: ConfigurationContext
      source: ProjectStateValidationSource
      operation?: PreparedYamlValidationOperation
    },
    producer: ProjectStateValidationProducer,
  ): Promise<ProjectStateValidationStats>
  runValidationFactPass(params: {
    projectDir: string
    context: ConfigurationContext
    files: PreparedYamlProjectFileDescriptor[]
  }): Promise<ValidationIndexContribution>
  close(): Promise<void>
  size(): number
}

export interface ProjectStateValidationSource {
  readonly batches: AsyncIterable<ProjectStateValidationFileBatch>
}

export interface ProjectStateValidationProducer {
  writeFragment(fragment: ProjectStateFragment): Promise<void>
  deleteFiles(projectPaths: readonly string[]): Promise<void>
}

export interface ProjectStateValidationStats {
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
  readonly missingFiles: number
}

export interface PreparedYamlValidationOperation {
  readonly signal: AbortSignal
  abort(reason: unknown): void
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
  operation?: MetadataWorkerOperation
}): PreparedYamlProjectWorkerPool {
  const pools = new Map<number, PreparedWorkerPool>()
  let operationFailed = false
  const createPool = params.operation === undefined
    ? (_workerIndex: number) => (params.createWorkerPool ?? createWorkerPool)()
    : (workerIndex: number): PreparedWorkerPool => ({
        async run(task) {
          try {
            return await params.operation!.run(workerIndex, {
              kind: "validation",
              task: task as PreparedYamlProjectWorkerTask,
            })
          } catch (caught) {
            operationFailed = true
            throw caught
          }
        },
        async destroy() {},
      })
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
    async initValidation(context, suppliedOperation) {
      const operation = suppliedOperation ?? createPreparedYamlValidationOperation()
      operation.signal.throwIfAborted()
      const indexesToInit = Array.from({ length: params.concurrency }, (_, index) => index).filter(
        (index) => !initializedValidationWorkerIndexes.has(index)
      )
      if (indexesToInit.length === 0 && validationStartProfile !== undefined) {
        return { ...validationStartProfile, reused: true }
      }

      const rulesSnapshot = createValidationRulesSnapshot(context)
      const startedAt = performance.now()
      let firstFailure: { readonly reason: unknown } | undefined
      const settled = await Promise.allSettled(
        indexesToInit.map(async (index) => {
          try {
            const task = { kind: "initValidation", workerIndex: index, context, rulesSnapshot } satisfies PreparedYamlProjectWorkerTask
            const response = (await getOrCreatePool(pools, index, createPool).run(
              task,
              { signal: operation.signal },
            )) as PreparedYamlProjectWorkerTaskResult
            if (response.kind !== "initValidationResult") throw new Error("Worker вернул неожиданный результат initValidation")
            return response
          } catch (caught) {
            firstFailure ??= { reason: caught }
            operation.abort(caught)
            throw caught
          }
        })
      )
      if (firstFailure !== undefined) throw firstFailure.reason
      const results = fulfilledValues(settled)

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
    async runProjectStateRefresh(refreshParams, producer) {
      const profileEnabled = process.env["NKDK_PROFILE"] === "1"
      const profiler = profileEnabled
        ? createOperationProfiler({
            operation: "validation",
            scope: { scope: "main" },
            aggregate: true,
          })
        : undefined
      const operation = refreshParams.operation ?? createPreparedYamlValidationOperation()
      const { signal } = operation
      await this.initValidation(refreshParams.context, operation)
      let taskCount = 0
      let taskPreparationMs = 0
      let workerWaitMs = 0
      let fragmentCount = 0
      let fragmentBytes = 0
      let applyFragmentMs = 0
      let deletionCount = 0
      let applyDeletionsMs = 0
      let firstFailure: { readonly reason: unknown } | undefined
      const batches = refreshParams.source.batches[Symbol.asyncIterator]()
      const settled = await Promise.allSettled(Array.from({ length: params.concurrency }, async (_unused, index) => {
        try {
          let hashedFiles = 0
          let parsedYamlFiles = 0
          let changedFiles = 0
          let missingFiles = 0
          while (true) {
            signal.throwIfAborted()
            const next = await batches.next()
            if (next.done) break
            const batch = next.value
            assertProjectStateFileBaselinePage({
              knownHashBits: batch.knownHashBits,
              hashBytes: batch.hashBytes,
              previousFileIds: batch.previousFileIds,
              storedFileCount: batch.storedFileCount,
            }, batch.files.length)
            let startedAt = profileEnabled ? performance.now() : 0
            const task = createProjectStateRefreshTask(refreshParams, index, batch)
            const workerInput = params.operation === undefined
              ? move(projectStateRefreshTransferable(task))
              : task
            if (profileEnabled) {
              taskPreparationMs += performance.now() - startedAt
              taskCount += 1
              startedAt = performance.now()
            }
            const response = (await getOrCreatePool(pools, index, createPool).run(
              workerInput,
              { signal },
            )) as PreparedYamlProjectWorkerTaskResult
            if (profileEnabled) workerWaitMs += performance.now() - startedAt
            if (response.kind !== "refreshProjectStateResult") {
              throw new Error("Worker вернул неожиданный результат refreshProjectState")
            }
            if (response.missingProjectPaths.length > 0) {
              signal.throwIfAborted()
              if (profileEnabled) startedAt = performance.now()
              await producer.deleteFiles(response.missingProjectPaths)
              if (profileEnabled) {
                applyDeletionsMs += performance.now() - startedAt
                deletionCount += response.missingProjectPaths.length
              }
            }
            hashedFiles += response.hashedFiles
            parsedYamlFiles += response.parsedYamlFiles
            changedFiles += response.changedFiles
            missingFiles += response.missingProjectPaths.length
          }
          signal.throwIfAborted()
          let startedAt = profileEnabled ? performance.now() : 0
          const finishResponse = (await getOrCreatePool(pools, index, createPool).run({
            kind: "finishProjectStateFragment",
            workerIndex: index,
          } satisfies PreparedYamlProjectWorkerTask, { signal })) as PreparedYamlProjectWorkerTaskResult
          if (finishResponse.kind !== "finishProjectStateFragmentResult") {
            throw new Error("Worker вернул неожиданный результат finishProjectStateFragment")
          }
          const fragmentView = openProjectStateFragment(finishResponse.fragment)
          if (fragmentView.fileCount > 0) await producer.writeFragment(finishResponse.fragment)
          if (profileEnabled) {
            applyFragmentMs += performance.now() - startedAt
            if (fragmentView.fileCount > 0) {
              fragmentCount += 1
              fragmentBytes += Object.values(finishResponse.fragment.buffers)
                .reduce((sum, buffer) => sum + buffer.byteLength, 0)
            }
          }
          return { hashedFiles, parsedYamlFiles, changedFiles, missingFiles }
        } catch (caught) {
          firstFailure ??= { reason: caught }
          operation.abort(caught)
          await getOrCreatePool(pools, index, createPool).run({
            kind: "finishProjectStateFragment",
            workerIndex: index,
          } satisfies PreparedYamlProjectWorkerTask).catch(() => undefined)
          throw caught
        }
      }))
      if (firstFailure !== undefined) throw firstFailure.reason
      profiler?.record("Обработка файлов Б1–Б4", "Подготовка заданий", {
        items: taskCount,
        timeMs: taskPreparationMs,
      })
      profiler?.record("Обработка файлов Б1–Б4", "Ожидание worker", {
        items: taskCount,
        timeMs: workerWaitMs,
      })
      profiler?.record("Обработка файлов Б1–Б4", "Применение двоичных фрагментов", {
        items: fragmentCount,
        bytes: fragmentBytes,
        timeMs: applyFragmentMs,
      })
      profiler?.record("Обработка файлов Б1–Б4", "Применение удалений", {
        items: deletionCount,
        timeMs: applyDeletionsMs,
      })
      profiler?.flush()
      return fulfilledValues(settled).reduce<ProjectStateValidationStats>((sum, current) => ({
        hashedFiles: sum.hashedFiles + current.hashedFiles,
        parsedYamlFiles: sum.parsedYamlFiles + current.parsedYamlFiles,
        changedFiles: sum.changedFiles + current.changedFiles,
        missingFiles: sum.missingFiles + current.missingFiles,
      }), { hashedFiles: 0, parsedYamlFiles: 0, changedFiles: 0, missingFiles: 0 })
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
    async close() {
      await Promise.all([...pools.values()].map((pool) => pool.destroy()))
      pools.clear()
      activeWorkerIndexes.clear()
      initializedValidationWorkerIndexes.clear()
      validationStartProfile = undefined
      await params.operation?.finish(operationFailed ? "failure" : "success")
    },
    size() {
      return params.concurrency
    },
  }
}

function createProjectStateRefreshTask(
  params: {
    readonly projectDir: string
    readonly context: ConfigurationContext
    readonly source: ProjectStateValidationSource
  },
  workerIndex: number,
  batch: ProjectStateValidationFileBatch,
): Extract<PreparedYamlProjectWorkerTask, { kind: "refreshProjectState" }> {
  return {
    kind: "refreshProjectState",
    workerIndex,
    projectDir: params.projectDir,
    context: params.context,
    files: batch.files,
    knownHashBits: batch.knownHashBits,
    expectedHashBytes: batch.hashBytes,
  }
}

function projectStateRefreshTransferable(
  task: Extract<PreparedYamlProjectWorkerTask, { kind: "refreshProjectState" }>,
) {
  return {
    get [transferableSymbol]() {
      return [task.knownHashBits.buffer as ArrayBuffer, task.expectedHashBytes.buffer as ArrayBuffer]
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

function getOrCreatePool(
  pools: Map<number, PreparedWorkerPool>,
  index: number,
  createPool: (workerIndex: number) => PreparedWorkerPool
): PreparedWorkerPool {
  const existing = pools.get(index)
  if (existing !== undefined) return existing

  const pool = createPool(index)
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

export function createPreparedYamlValidationOperation(parentSignal?: AbortSignal): PreparedYamlValidationOperation {
  const controller = new AbortController()
  return {
    signal: parentSignal === undefined
      ? controller.signal
      : AbortSignal.any([parentSignal, controller.signal]),
    abort(reason) {
      if (!controller.signal.aborted) controller.abort(reason)
    },
  }
}

function fulfilledValues<T>(results: readonly PromiseSettledResult<T>[]): T[] {
  return results.flatMap((outcome) => outcome.status === "fulfilled" ? [outcome.value] : [])
}
