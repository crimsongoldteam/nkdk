import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  buildBackendProcessEnv,
  evaluateRustExperiment,
  measureProjectStateBackends,
  parseProjectStateBackendMeasureArgs,
} from "./measure-project-state-backends"
import {
  assertProjectStateBackendAvailable,
  createMemoryPeakTracker,
  measureProjectStateBackend,
  parseProjectStateBackendWorkerArgs,
} from "./measure-project-state-backend-worker"

describe("measure project state backends args", () => {
  it("применяет согласованные пороги включительно", () => {
    expect(evaluateRustExperiment({
      typescript: { rssPeak: 100, targetMs: 100, unchangedMs: 100 },
      rust: { rssPeak: 75, targetMs: 80, unchangedMs: 105 },
    })).toEqual({
      rssPassed: true,
      targetTimePassed: true,
      unchangedPassed: true,
      passed: true,
    })
  })

  it("разбирает проект, число прогонов, worker и обе реализации", () => {
    expect(parseProjectStateBackendMeasureArgs([
      "/project",
      "--runs", "5",
      "--concurrency", "4",
    ])).toEqual({
      projectDir: resolve("/project"),
      runs: 5,
      concurrency: 4,
      backends: ["typescript", "rust"],
      lookups: 1_000_000,
    })
  })

  it("ограничивает запуск одним явно выбранным вариантом", () => {
    expect(buildBackendProcessEnv("rust", { PATH: "/bin" })).toEqual({
      PATH: "/bin",
      NKDK_PROJECT_STATE_BACKEND: "rust",
      NKDK_PROFILE: "1",
    })
  })

  it("изолирует каждый повтор каждой реализации", async () => {
    const calls: Array<{ backend: string; run: number }> = []
    const results = await measureProjectStateBackends({
      projectDir: resolve("/project"),
      runs: 2,
      concurrency: 3,
      backends: ["typescript", "rust"],
      lookups: 10,
    }, async (options) => {
      calls.push({ backend: options.backend, run: options.run })
      return {
        backend: options.backend,
        run: options.run,
        elapsedMs: 1,
        cpuUserMicros: 2,
        cpuSystemMicros: 3,
        rssPeakBytes: 4,
        heapUsedPeakBytes: 5,
        externalPeakBytes: 6,
        arrayBuffersPeakBytes: 7,
        snapshotBytes: 8,
        diagnosticsDigest: "digest",
        found: 9,
        missing: 1,
      }
    })

    expect(calls).toEqual([
      { backend: "typescript", run: 1 },
      { backend: "typescript", run: 2 },
      { backend: "rust", run: 1 },
      { backend: "rust", run: 2 },
    ])
    expect(results).toHaveLength(4)
  })
})

describe("measure project state backend worker", () => {
  it("сохраняет максимум каждого показателя памяти", () => {
    const tracker = createMemoryPeakTracker({
      rss: 100, heapTotal: 200, heapUsed: 60, external: 30, arrayBuffers: 20,
    })
    tracker.observe({
      rss: 150, heapTotal: 180, heapUsed: 50, external: 40, arrayBuffers: 10,
    })

    expect(tracker.peak()).toEqual({
      rss: 150, heapTotal: 200, heapUsed: 60, external: 40, arrayBuffers: 20,
    })
  })

  it("разбирает один вариант и параметры поисковой нагрузки", () => {
    expect(parseProjectStateBackendWorkerArgs([
      "/project",
      "--backend", "typescript",
      "--run", "3",
      "--lookups", "2000",
      "--workers", "2",
    ])).toEqual({
      projectDir: resolve("/project"),
      backend: "typescript",
      run: 3,
      lookups: 2_000,
      workers: 2,
    })
  })

  it("не подменяет недоступный Rust вариант TypeScript реализацией", () => {
    expect(() => assertProjectStateBackendAvailable("rust", false)).toThrowError(
      expect.objectContaining({ code: "RUST_BACKEND_UNAVAILABLE" }),
    )
  })

  it("возвращает машинные показатели одного TypeScript прогона", async () => {
    const result = await measureProjectStateBackend({
      projectDir: resolve("/project"),
      backend: "typescript",
      run: 3,
      lookups: 2_000,
      workers: 2,
    }, {
      now: sequence([100, 350]),
      cpuUsage: sequence([
        { user: 1_000, system: 2_000 },
        { user: 11_000, system: 7_000 },
      ]),
      measure: async () => ({
        projectDir: resolve("/project"),
        lookups: 2_000,
        workers: 2,
        fileBytes: 4_096,
        seconds: { read: 0.01, write: 0.02, lookup: 0.2 },
        results: { found: 1_800, missing: 200 },
        rssMiB: 128,
        hashIndexes: {
          strings: { size: 1, capacity: 2, loadFactor: 0.5 },
          targets: { size: 1, capacity: 2, loadFactor: 0.5 },
          owners: { size: 1, capacity: 2, loadFactor: 0.5 },
        },
      }),
      diagnosticsDigest: async () => "abc123",
      memoryUsage: () => ({
        rss: 100,
        heapTotal: 200,
        heapUsed: 60,
        external: 30,
        arrayBuffers: 20,
      }),
    })

    expect(result).toEqual({
      backend: "typescript",
      run: 3,
      elapsedMs: 250,
      cpuUserMicros: 10_000,
      cpuSystemMicros: 5_000,
      rssPeakBytes: 128 * 1024 * 1024,
      heapUsedPeakBytes: 60,
      externalPeakBytes: 30,
      arrayBuffersPeakBytes: 20,
      snapshotBytes: 4_096,
      diagnosticsDigest: "abc123",
      found: 1_800,
      missing: 200,
    })
  })
})

function sequence<T>(values: readonly T[]): () => T {
  let index = 0
  return () => values[index++]!
}
