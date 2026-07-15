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
      try {
        return fn()
      } finally {
        records.push(createRecord({ step, substep, scope, items: params.items, bytes: params.bytes, tracker, startedAt }))
      }
    },
    async measureAsync(step, substep, params, fn) {
      const tracker = createMemoryTracker()
      const startedAt = performance.now()
      try {
        return await fn()
      } finally {
        records.push(createRecord({ step, substep, scope, items: params.items, bytes: params.bytes, tracker, startedAt }))
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
      if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return
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

function encodeProfileValue(value: string): string {
  return JSON.stringify(value)
}

function bytesToMiB(value: number): number {
  return value / 1024 / 1024
}
