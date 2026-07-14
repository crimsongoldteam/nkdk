import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import Piscina from "piscina"
import type { ConfigurationContext } from "../context/types"
import type { Diagnostic } from "../validation/types"
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
  }): Promise<PreparedYamlProjectWorkerPoolResult>
  close(): Promise<void>
}

export interface PreparedYamlProjectWorkerPoolResult {
  diagnostics: Diagnostic[]
  metadataIndex: PreparedGlobalMetadataIndex
  workers: PreparedYamlWorkerPartition[]
}

type PreparedMetadataDeclarationMergeResult =
  | { ok: true; index: PreparedGlobalMetadataIndex }
  | { ok: false; code: "declaration_conflict"; message: string; diagnostics: Diagnostic[] }

export function createPreparedYamlProjectWorkerPool(params: { concurrency: number }): PreparedYamlProjectWorkerPool {
  const pools = Array.from({ length: params.concurrency }, () => createWorkerPool())

  return {
    async run(runParams) {
      const partitions = partitionRoundRobin(runParams.files, pools.length)
      const results = await Promise.all(
        pools.map(async (pool, index): Promise<PreparedYamlProjectWorkerPoolResult & { workerIndex: number }> => {
          const files = partitions[index] ?? []
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

          const response = (await pool.run({
            kind: "prepare",
            projectDir: runParams.projectDir,
            context: runParams.context,
            files,
          } satisfies PreparedYamlProjectWorkerTask)) as PreparedYamlProjectWorkerTaskResult
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
    async close() {
      await Promise.all(pools.map((pool) => pool.destroy()))
    },
  }
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
