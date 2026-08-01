import { fileURLToPath } from "node:url"
import { MessageChannel, Worker, type MessagePort } from "node:worker_threads"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type { SqliteFirstPassExperimentStats } from "./sqliteFirstPassExperimentProtocol"

type WorkerResultMessage =
  | { readonly kind: "completed"; readonly stats: SqliteFirstPassExperimentStats }
  | { readonly kind: "failed"; readonly message: string }

export interface SqliteFirstPassExperimentSession {
  readonly producerPorts: readonly MessagePort[]
  readonly result: Promise<SqliteFirstPassExperimentStats>
  close(): Promise<void>
  abort(cause?: unknown): Promise<void>
}

export function createSqliteFirstPassExperimentSession(
  producerCount: number,
): SqliteFirstPassExperimentSession {
  if (!Number.isInteger(producerCount) || producerCount <= 0) {
    throw new Error("producerCount must be a positive integer")
  }
  const channels = Array.from({ length: producerCount }, () => new MessageChannel())
  const producerPorts = channels.map(({ port1 }) => port1)
  const storePorts = channels.map(({ port2 }) => port2)
  const currentFile = fileURLToPath(import.meta.url)
  const sourceMode = currentFile.endsWith(".ts")
  const worker = new Worker(
    new URL(
      sourceMode
        ? "./sqliteFirstPassExperimentWorker.ts"
        : "./sqliteFirstPassExperimentWorker.js",
      import.meta.url,
    ),
    {
      workerData: { ports: storePorts },
      transferList: storePorts,
      execArgv: sourceMode ? sourceWorkerExecArgv() : [],
    },
  )

  let settled = false
  let resolveResult!: (stats: SqliteFirstPassExperimentStats) => void
  let rejectResult!: (cause: Error) => void
  const result = new Promise<SqliteFirstPassExperimentStats>((resolve, reject) => {
    resolveResult = resolve
    rejectResult = reject
  })
  void result.catch(() => undefined)
  const exited = new Promise<number>((resolve) => worker.once("exit", resolve))

  worker.on("message", (message: WorkerResultMessage) => {
    if (settled) return
    settled = true
    if (message.kind === "completed") resolveResult(message.stats)
    else rejectResult(new Error(message.message))
  })
  worker.on("error", (error) => {
    if (settled) return
    settled = true
    rejectResult(error)
  })
  worker.on("exit", (code) => {
    if (settled) return
    settled = true
    rejectResult(new Error(`SQLite experiment worker exited before completion with code ${code}`))
  })

  return {
    producerPorts,
    result,
    async close() {
      await result
      await exited
    },
    async abort(cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause ?? "SQLite experiment aborted"))
      if (!settled) {
        settled = true
        rejectResult(error)
        worker.postMessage({ kind: "abort", message: error.message })
      }
      await worker.terminate()
      for (const port of producerPorts) port.close()
    },
  }
}
