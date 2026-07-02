import { dirname, join } from "node:path"
import { Worker } from "node:worker_threads"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { ConfigurationContext } from "../context/types"
import type { ValidationProjectFile } from "./projectFiles"
import type { ValidationMode, ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

export interface FirstPassPoolParams {
  projectDir: string
  context: ConfigurationContext
  files: readonly ValidationProjectFile[]
}

export interface FirstPassPoolResult {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
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

export interface ProjectValidationWorkerPool {
  start(): Promise<void>
  close(): Promise<void>
  size(): number
  runFirstPass(params: FirstPassPoolParams): Promise<FirstPassPoolResult>
  runSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
}

type WorkerRequest =
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
      objectTable: ValidationObjectTableSnapshot
      filePaths: string[]
    }

type WorkerResponse =
  | { kind: "firstPassResult"; diagnostics: Diagnostic[]; objectRecords: ValidationObjectRecord[] }
  | { kind: "secondPassResult"; diagnostics: Diagnostic[] }
  | { kind: "error"; message: string }

export function createProjectValidationWorkerPool(params: { concurrency: number }): ProjectValidationWorkerPool {
  const workers: Worker[] = []
  const assignedFilePaths = new Map<Worker, string[]>()

  return {
    async start() {
      while (workers.length < params.concurrency) workers.push(createWorker())
    },
    async close() {
      await Promise.all(workers.map((worker) => worker.terminate()))
    },
    size() {
      return workers.length
    },
    async runFirstPass(firstPassParams) {
      const partitions = partitionRoundRobin(firstPassParams.files, workers.length)
      const results = await Promise.all(
        workers.map(async (worker, index) => {
          const files = partitions[index] ?? []
          const filePaths = files.map((file) => file.absolutePath)
          assignedFilePaths.set(worker, filePaths)
          if (filePaths.length === 0) return { diagnostics: [], objectRecords: [] }

          const response = await request(worker, {
            kind: "firstPass",
            projectDir: firstPassParams.projectDir,
            context: firstPassParams.context,
            filePaths,
          })
          if (response.kind !== "firstPassResult") throw new Error("Worker вернул неожиданный результат firstPass")
          return response
        })
      )

      return {
        diagnostics: results.flatMap((result) => result.diagnostics),
        objectRecords: results.flatMap((result) => result.objectRecords),
      }
    },
    async runSecondPass(secondPassParams) {
      const results = await Promise.all(
        workers.map(async (worker) => {
          const filePaths = assignedFilePaths.get(worker) ?? []
          if (filePaths.length === 0) return { diagnostics: [] }

          const response = await request(worker, {
            kind: "secondPass",
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            objectTable: secondPassParams.objectTable,
            filePaths,
          })
          if (response.kind !== "secondPassResult") throw new Error("Worker вернул неожиданный результат secondPass")
          return response
        })
      )

      return { diagnostics: results.flatMap((result) => result.diagnostics) }
    },
  }
}

function createWorker(): Worker {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "projectValidationWorker.ts")
    : join(dirname(currentFile), "projectValidationWorker.js")
  const execArgv = workerFile.endsWith(".ts") ? withTypeScriptWorkerLoader(dirname(currentFile)) : process.execArgv

  return new Worker(workerFile, { execArgv })
}

function withTypeScriptWorkerLoader(workerDir: string): string[] {
  const registerUrl = pathToFileURL(join(workerDir, "projectValidationWorkerRegister.mjs")).href
  return ["--import", "tsx", "--import", registerUrl]
}

let nextRequestId = 1

function request(worker: Worker, message: WorkerRequest): Promise<WorkerResponse> {
  const id = nextRequestId++
  return new Promise((resolve, reject) => {
    const onMessage = (response: WorkerResponse & { id?: number }) => {
      if (response.id !== id) return
      cleanup()
      if (response.kind === "error") reject(new Error(response.message))
      else resolve(response)
    }
    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      worker.off("message", onMessage)
      worker.off("error", onError)
    }

    worker.on("message", onMessage)
    worker.on("error", onError)
    worker.postMessage({ ...message, id })
  })
}

function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const result = Array.from({ length: count }, () => [] as T[])
  items.forEach((item, index) => result[index % count]?.push(item))
  return result
}
