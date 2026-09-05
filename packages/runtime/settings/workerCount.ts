export type WorkerCountSource = "operation" | "project" | "automatic"

export function assertWorkerCount(value: unknown, field = "workerCount"): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${field} должен быть положительным безопасным целым числом`)
  }
}

export function resolveWorkerCount(params: {
  concurrency?: number
  workerCount?: number
  automatic: () => number
}): { count: number; source: WorkerCountSource } {
  if (params.workerCount !== undefined) assertWorkerCount(params.workerCount)
  if (params.concurrency !== undefined) {
    assertWorkerCount(params.concurrency, "concurrency")
    return { count: params.concurrency, source: "operation" }
  }
  if (params.workerCount !== undefined) return { count: params.workerCount, source: "project" }
  const count = params.automatic()
  assertWorkerCount(count, "automatic workerCount")
  return { count, source: "automatic" }
}
