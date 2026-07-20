import { performance } from "node:perf_hooks"

export type ValidationProfileScope = { scope: "main" } | { scope: "worker"; workerIndex: number }

export interface ValidationProfileRecord {
  step: string
  substep: string
  scope: "main" | "worker"
  workerIndex?: number
  items?: number
  timeMs: number
  rssStartMiB: number
  rssEndMiB: number
  rssPeakMiB: number
  heapStartMiB: number
  heapEndMiB: number
  heapPeakMiB: number
  bytes?: number
}

export interface ValidationProfiler {
  measure<T>(step: string, substep: string, params: { items?: number; bytes?: number }, fn: () => T): T
  measureAsync<T>(
    step: string,
    substep: string,
    params: { items?: number; bytes?: number },
    fn: () => Promise<T>
  ): Promise<T>
  record(step: string, substep: string, params: { items?: number; timeMs: number; bytes?: number }): void
  records(): ValidationProfileRecord[]
  flush(): void
}

export function createValidationProfiler(scope: ValidationProfileScope): ValidationProfiler {
  const records: ValidationProfileRecord[] = []

  return {
    measure(step, substep, params, fn) {
      const tracker = createMemoryTracker()
      const startedAt = performance.now()
      printProfileStageBoundary("start", { step, substep, scope, items: params.items, bytes: params.bytes })
      try {
        return fn()
      } finally {
        const record = createRecord({ step, substep, scope, items: params.items, bytes: params.bytes, tracker, startedAt })
        records.push(record)
        printProfileStageBoundary("end", record)
      }
    },
    async measureAsync(step, substep, params, fn) {
      const tracker = createMemoryTracker()
      const startedAt = performance.now()
      printProfileStageBoundary("start", { step, substep, scope, items: params.items, bytes: params.bytes })
      try {
        return await fn()
      } finally {
        const record = createRecord({ step, substep, scope, items: params.items, bytes: params.bytes, tracker, startedAt })
        records.push(record)
        printProfileStageBoundary("end", record)
      }
    },
    record(step, substep, params) {
      const tracker = createMemoryTracker()
      records.push(createRecord({ step, substep, scope, items: params.items, bytes: params.bytes, tracker, timeMs: params.timeMs }))
    },
    records() {
      return [...records]
    },
    flush() {
      if (!isProfilingEnabled()) return
      for (const record of records) console.error(formatValidationProfileRecord(record))
    },
  }
}

function createRecord(params: {
  step: string
  substep: string
  scope: ValidationProfileScope
  items: number | undefined
  bytes: number | undefined
  tracker: ReturnType<typeof createMemoryTracker>
  startedAt?: number
  timeMs?: number
}): ValidationProfileRecord {
  params.tracker.sample()
  return {
    step: params.step,
    substep: params.substep,
    scope: params.scope.scope,
    ...(params.scope.scope === "worker" ? { workerIndex: params.scope.workerIndex } : {}),
    ...(params.items === undefined ? {} : { items: params.items }),
    ...(params.bytes === undefined ? {} : { bytes: params.bytes }),
    timeMs: params.timeMs ?? performance.now() - (params.startedAt ?? performance.now()),
    ...params.tracker.snapshot(),
  }
}

function createMemoryTracker() {
  const start = process.memoryUsage()
  let peakRss = start.rss
  let peakHeapUsed = start.heapUsed

  return {
    sample() {
      const memory = process.memoryUsage()
      peakRss = Math.max(peakRss, memory.rss)
      peakHeapUsed = Math.max(peakHeapUsed, memory.heapUsed)
    },
    snapshot() {
      const end = process.memoryUsage()
      peakRss = Math.max(peakRss, end.rss)
      peakHeapUsed = Math.max(peakHeapUsed, end.heapUsed)
      return {
        rssStartMiB: bytesToMiB(start.rss),
        rssEndMiB: bytesToMiB(end.rss),
        rssPeakMiB: bytesToMiB(peakRss),
        heapStartMiB: bytesToMiB(start.heapUsed),
        heapEndMiB: bytesToMiB(end.heapUsed),
        heapPeakMiB: bytesToMiB(peakHeapUsed),
      }
    },
  }
}

function formatValidationProfileRecord(record: ValidationProfileRecord): string {
  return [
    "[validation-step]",
    `step=${encodeProfileValue(record.step)}`,
    `substep=${encodeProfileValue(record.substep)}`,
    `scope=${record.scope}`,
    record.workerIndex === undefined ? undefined : `worker=${record.workerIndex}`,
    record.items === undefined ? undefined : `items=${record.items}`,
    record.bytes === undefined ? undefined : `bytes=${record.bytes}`,
    `time=${record.timeMs.toFixed(2)}ms`,
    `rssStart=${record.rssStartMiB.toFixed(1)}MiB`,
    `rssEnd=${record.rssEndMiB.toFixed(1)}MiB`,
    `rssPeak=${record.rssPeakMiB.toFixed(1)}MiB`,
    `heapStart=${record.heapStartMiB.toFixed(1)}MiB`,
    `heapEnd=${record.heapEndMiB.toFixed(1)}MiB`,
    `heapPeak=${record.heapPeakMiB.toFixed(1)}MiB`,
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ")
}

function printProfileStageBoundary(
  boundary: "start" | "end",
  params:
    | ValidationProfileRecord
    | {
        step: string
        substep: string
        scope: ValidationProfileScope
        items: number | undefined
        bytes: number | undefined
      }
): void {
  if (!isFullSyncProfilingEnabled()) return
  const scopeName = typeof params.scope === "object" ? params.scope.scope : params.scope
  const workerIndex =
    typeof params.scope === "object"
      ? params.scope.scope === "worker"
        ? params.scope.workerIndex
        : undefined
      : "workerIndex" in params
        ? params.workerIndex
        : undefined
  console.error(
    [
      "[validation-step-boundary]",
      `event=${boundary}`,
      `step=${encodeProfileValue(params.step)}`,
      `substep=${encodeProfileValue(params.substep)}`,
      `scope=${scopeName}`,
      workerIndex === undefined ? undefined : `worker=${workerIndex}`,
      params.items === undefined ? undefined : `items=${params.items}`,
      params.bytes === undefined ? undefined : `bytes=${params.bytes}`,
      "timeMs" in params ? `time=${params.timeMs.toFixed(2)}ms` : undefined,
      "rssEndMiB" in params ? `rss=${params.rssEndMiB.toFixed(1)}MiB` : undefined,
      "heapEndMiB" in params ? `heap=${params.heapEndMiB.toFixed(1)}MiB` : undefined,
    ]
      .filter((part): part is string => part !== undefined)
      .join(" ")
  )
}

function isProfilingEnabled(): boolean {
  return process.env["NKDK_VALIDATION_TIMING"] === "1" || process.env["NKDK_FULL_SYNC_PROFILE"] === "1"
}

function isFullSyncProfilingEnabled(): boolean {
  return process.env["NKDK_FULL_SYNC_PROFILE"] === "1"
}

function encodeProfileValue(value: string): string {
  return JSON.stringify(value)
}

function bytesToMiB(value: number): number {
  return value / 1024 / 1024
}
