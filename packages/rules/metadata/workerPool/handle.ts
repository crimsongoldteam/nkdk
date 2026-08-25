import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { sourceWorkerExecArgv } from "../sourceWorkerRuntime"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { cloneBinaryProjectStateReadToken } from "../projectState/binary/readToken"
import type {
  MetadataWorkerCommand,
  MetadataWorkerCommandResult,
  MetadataWorkerLine,
  MetadataWorkerOperation,
  MetadataWorkerOperationOutcome,
  MetadataWorkerOperationResult,
  MetadataWorkerPoolHandle,
} from "./types"

export function createMetadataWorkerPoolHandle(params: {
  readonly workerUrl?: URL
  createLine?: (workerUrl?: URL) => MetadataWorkerLine
} = {}): MetadataWorkerPoolHandle {
  const lines = new Map<number, MetadataWorkerLine>()
  const createLine = params.createLine ?? createPiscinaLine
  let activeOperationId: string | undefined
  let projectStateSeed: ProjectStateReadToken | undefined
  let closed = false
  let closePromise: Promise<void> | undefined

  return {
    async beginOperation(operationParams) {
      if (closed) throw new Error("Универсальный пул worker закрыт")
      if (activeOperationId !== undefined) throw new Error("Универсальный пул worker уже выполняет операцию")
      assertConcurrency(operationParams.concurrency)
      operationParams.signal?.throwIfAborted()
      activeOperationId = operationParams.id
      const used = new Set<number>()
      let finished = false

      try {
        for (let workerIndex = 0; workerIndex < operationParams.concurrency; workerIndex += 1) {
          if (lines.has(workerIndex)) continue
          const line = createLine(params.workerUrl)
          lines.set(workerIndex, line)
          try {
            await line.run({
              kind: "initializeLine",
              workerIndex,
              context: operationParams.context,
            })
            if (projectStateSeed !== undefined) {
              await line.run({
                kind: "installProjectState",
                readToken: cloneBinaryProjectStateReadToken(projectStateSeed),
              })
            }
          } catch (caught) {
            lines.delete(workerIndex)
            await line.destroy().catch(() => undefined)
            throw caught
          }
        }
      } catch (caught) {
        activeOperationId = undefined
        throw caught
      }

      const operation: MetadataWorkerOperation = {
        id: operationParams.id,
        concurrency: operationParams.concurrency,
        async run(workerIndex, command) {
          assertActiveOperation(operationParams.id, activeOperationId, finished)
          assertWorkerIndex(workerIndex, operationParams.concurrency)
          operationParams.signal?.throwIfAborted()
          const line = requireLine(lines, workerIndex)
          used.add(workerIndex)
          let result: MetadataWorkerCommandResult
          try {
            result = await line.run({
              kind: "runOperation",
              operationId: operationParams.id,
              command,
            })
          } catch (caught) {
            used.delete(workerIndex)
            if (lines.get(workerIndex) === line) lines.delete(workerIndex)
            await line.destroy().catch(() => undefined)
            throw caught
          }
          assertActiveOperation(operationParams.id, activeOperationId, finished)
          return requireOperationResult(result)
        },
        async finish(outcome) {
          if (finished) return
          assertActiveOperation(operationParams.id, activeOperationId, finished)
          finished = true
          try {
            await resetUsedLines(lines, used, operationParams.id, outcome)
          } finally {
            if (activeOperationId === operationParams.id) activeOperationId = undefined
          }
        },
      }
      return operation
    },
    async installProjectState(token) {
      assertHandleOpen(closed)
      projectStateSeed = cloneBinaryProjectStateReadToken(token)
      await sendProjectStateCommand(lines, () => ({
        kind: "installProjectState",
        readToken: cloneBinaryProjectStateReadToken(projectStateSeed!),
      }))
    },
    async clearProjectState() {
      assertHandleOpen(closed)
      projectStateSeed = undefined
      await sendProjectStateCommand(lines, () => ({ kind: "clearProjectState" }))
    },
    size() {
      return lines.size
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      activeOperationId = undefined
      closePromise = Promise.all([...lines.values()].map((line) => line.destroy())).then(() => undefined)
      return closePromise
    },
  }
}

type ProjectStateLineCommand =
  | { readonly kind: "installProjectState"; readonly readToken: ProjectStateReadToken }
  | { readonly kind: "clearProjectState" }

async function sendProjectStateCommand(
  lines: Map<number, MetadataWorkerLine>,
  createCommand: (workerIndex: number) => ProjectStateLineCommand,
): Promise<void> {
  const failures: unknown[] = []
  await Promise.all([...lines].map(([workerIndex, line]) =>
    runRecoverableLineCommand(lines, workerIndex, line, createCommand(workerIndex), failures)
  ))
  throwLineFailures(failures, "Не удалось установить состояние проекта в worker")
}

async function resetUsedLines(
  lines: Map<number, MetadataWorkerLine>,
  used: ReadonlySet<number>,
  operationId: string,
  outcome: MetadataWorkerOperationOutcome
): Promise<void> {
  const failures: unknown[] = []
  await Promise.all([...used].map((workerIndex) => {
    const line = lines.get(workerIndex)
    if (line === undefined) return
    return runRecoverableLineCommand(
      lines,
      workerIndex,
      line,
      { kind: "resetOperation", operationId, outcome },
      failures,
    )
  }))
  throwLineFailures(failures, "Не удалось очистить состояние worker")
}

async function runRecoverableLineCommand(
  lines: Map<number, MetadataWorkerLine>,
  workerIndex: number,
  line: MetadataWorkerLine,
  command: MetadataWorkerCommand,
  failures: unknown[],
): Promise<void> {
  try {
    await line.run(command)
  } catch (caught) {
    failures.push(caught)
    if (lines.get(workerIndex) === line) lines.delete(workerIndex)
    await line.destroy().catch(() => undefined)
  }
}

function throwLineFailures(failures: readonly unknown[], message: string): void {
  if (failures.length === 1) throw failures[0]
  if (failures.length > 1) throw new AggregateError(failures, message)
}

function requireOperationResult(result: MetadataWorkerCommandResult): MetadataWorkerOperationResult {
  if (result === undefined) throw new Error("Worker не вернул результат операции")
  return result
}

function requireLine(lines: ReadonlyMap<number, MetadataWorkerLine>, workerIndex: number): MetadataWorkerLine {
  const line = lines.get(workerIndex)
  if (line === undefined) throw new Error(`Линия worker ${workerIndex} недоступна`)
  return line
}

function assertActiveOperation(id: string, activeId: string | undefined, finished: boolean): void {
  if (finished || activeId !== id) throw new Error(`Операция worker ${id} уже завершена`)
}

function assertConcurrency(concurrency: number): void {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error("Степень параллелизма worker должна быть положительным целым числом")
  }
}

function assertHandleOpen(closed: boolean): void {
  if (closed) throw new Error("Универсальный пул worker закрыт")
}

function assertWorkerIndex(workerIndex: number, concurrency: number): void {
  if (!Number.isSafeInteger(workerIndex) || workerIndex < 0 || workerIndex >= concurrency) {
    throw new Error(`Индекс worker ${workerIndex} выходит за пределы операции`)
  }
}

function createPiscinaLine(workerUrl?: URL): MetadataWorkerLine {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = workerUrl === undefined
    ? currentFile.endsWith(".ts")
      ? join(dirname(currentFile), "worker.ts")
      : join(dirname(currentFile), "worker.js")
    : fileURLToPath(workerUrl)
  const execArgv = workerFile.endsWith(".ts") ? sourceWorkerExecArgv() : []
  const piscina = new Piscina({
    filename: workerFile,
    minThreads: 1,
    maxThreads: 1,
    execArgv,
    // Операционные линии долго удерживают смысловое состояние между
    // проходами. Ограниченная куча не даёт временным XML/YAML-деревьям
    // расширить каждую линию почти до общего лимита процесса.
    resourceLimits: { maxOldGenerationSizeMb: 768 },
  })
  return piscina
}
