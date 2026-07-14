import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import Piscina from "piscina"
import type { Diagnostic } from "../validation/types"
import type { PreparedYamlProjectFileDescriptor, PreparedYamlWorkerPartition } from "./preparedYamlProject"
import type { PreparedYamlProjectWorkerTask, PreparedYamlProjectWorkerTaskResult } from "./preparedYamlProjectWorker"

export interface PreparedYamlProjectWorkerPool {
  run(files: PreparedYamlProjectFileDescriptor[]): Promise<PreparedYamlProjectWorkerPoolResult>
  close(): Promise<void>
}

export interface PreparedYamlProjectWorkerPoolResult {
  diagnostics: Diagnostic[]
  workers: PreparedYamlWorkerPartition[]
}

export function createPreparedYamlProjectWorkerPool(params: { concurrency: number }): PreparedYamlProjectWorkerPool {
  const pools = Array.from({ length: params.concurrency }, () => createWorkerPool())

  return {
    async run(files) {
      const partitions = partitionRoundRobin(files, pools.length)
      const results = await Promise.all(
        pools.map(async (pool, index): Promise<PreparedYamlProjectWorkerPoolResult & { workerIndex: number }> => {
          const response = (await pool.run({
            kind: "prepare",
            files: partitions[index] ?? [],
          } satisfies PreparedYamlProjectWorkerTask)) as PreparedYamlProjectWorkerTaskResult
          if (response.kind !== "prepareResult") throw new Error("Worker вернул неожиданный результат prepare")
          return {
            workerIndex: index,
            diagnostics: response.diagnostics,
            workers: [
              {
                workerIndex: index,
                yamlFiles: response.yamlFiles,
                dependencyIndex: { dependencies: [] },
              },
            ],
          }
        })
      )
      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        workers: results.flatMap((result) => result.workers),
      }
    },
    async close() {
      await Promise.all(pools.map((pool) => pool.destroy()))
    },
  }
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
