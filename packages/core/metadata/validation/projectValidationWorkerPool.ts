import { dirname, join, resolve } from "node:path"
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

interface WorkerSecondPassTiming {
  contextMs: number
  validationMs: number
  fileCount: number
  supplementRecords: number
  supplementFilePaths: number
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
  | {
      kind: "secondPassResult"
      diagnostics: Diagnostic[]
      timing?: WorkerSecondPassTiming
      profile?: WorkerSecondPassProfile
    }
  | { kind: "error"; message: string }

export function createProjectValidationWorkerPool(params: { concurrency: number }): ProjectValidationWorkerPool {
  const workers: Worker[] = []
  const assignedFilePaths = new Map<Worker, string[]>()
  const localObjectRecordPaths = new Map<Worker, Set<string>>()

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
          if (filePaths.length === 0) {
            localObjectRecordPaths.set(worker, new Set())
            return { diagnostics: [], objectRecords: [] }
          }

          const response = await request(worker, {
            kind: "firstPass",
            projectDir: firstPassParams.projectDir,
            context: firstPassParams.context,
            filePaths,
          })
          if (response.kind !== "firstPassResult") throw new Error("Worker вернул неожиданный результат firstPass")
          localObjectRecordPaths.set(worker, new Set(response.objectRecords.map((record) => record.filePath)))
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
        workers.map(async (worker, index) => {
          const filePaths = assignedFilePaths.get(worker) ?? []
          if (filePaths.length === 0) return { index, diagnostics: [] }
          const objectTable = createWorkerTableSupplement(
            secondPassParams.objectTable,
            localObjectRecordPaths.get(worker) ?? new Set()
          )

          const response = await request(worker, {
            kind: "secondPass",
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            objectTable,
            filePaths,
          })
          if (response.kind !== "secondPassResult") throw new Error("Worker вернул неожиданный результат secondPass")
          return { index, ...response }
        })
      )

      logSecondPassTiming(results)
      logSecondPassProfile(results)

      return { diagnostics: results.flatMap((result) => result.diagnostics) }
    },
  }
}

function logSecondPassTiming(results: Array<{ index: number; timing?: WorkerSecondPassTiming }>): void {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return

  for (const result of results) {
    if (result.timing === undefined) continue
    console.error(
      [
        `[validation] worker ${result.index} second pass`,
        `files=${result.timing.fileCount}`,
        `supplementRecords=${result.timing.supplementRecords}`,
        `supplementFilePaths=${result.timing.supplementFilePaths}`,
        `context=${result.timing.contextMs.toFixed(2)}ms`,
        `validation=${result.timing.validationMs.toFixed(2)}ms`,
      ].join(" ")
    )
  }
}

function logSecondPassProfile(results: Array<{ index: number; profile?: WorkerSecondPassProfile }>): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return

  const summary = new Map<string, { count: number; diagnostics: number; totalMs: number; maxMs: number }>()

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

export function createWorkerTableSupplement(
  snapshot: ValidationObjectTableSnapshot,
  localFilePaths: ReadonlySet<string>
): ValidationObjectTableSnapshot {
  const local = new Set([...localFilePaths].map((filePath) => resolve(filePath)))

  return {
    records: snapshot.records.filter((record) => !local.has(resolve(record.filePath))),
    filePaths: snapshot.filePaths.filter((filePath) => !local.has(resolve(filePath))),
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
