import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  measureProjectStateValidationBackends,
  parseValidationMeasureArgs,
  summarizeValidationRuns,
} from "./measure-project-state-validation-backends"

describe("measure project state validation backends", () => {
  it("разбирает число прогонов, реализации и размер страницы", () => {
    expect(parseValidationMeasureArgs([
      "/project",
      "--runs", "5",
      "--backends", "typescript,rust",
      "--page-size", "500",
    ])).toEqual({
      projectDir: resolve("/project"),
      runs: 5,
      backends: ["typescript", "rust"],
      pageSize: 500,
    })
  })

  it("запускает каждый вариант в отдельном процессе", async () => {
    const calls: Array<{ backend: string; run: number }> = []
    const runs = await measureProjectStateValidationBackends({
      projectDir: resolve("/project"),
      runs: 2,
      backends: ["typescript", "rust"],
      pageSize: 2_000,
    }, async (options) => {
      calls.push({ backend: options.backend, run: options.run })
      return run(options.backend, options.run, options.run * 10)
    })

    expect(calls.map(({ backend, run }) => `${backend}:${run}`))
      .toEqual(["typescript:1", "typescript:2", "rust:1", "rust:2"])
    expect(runs).toHaveLength(4)
  })

  it("считает медианы и требует одинаковых диагностик", () => {
    const runs = [run("typescript", 1, 30), run("typescript", 2, 10), run("typescript", 3, 20)]
    expect(summarizeValidationRuns(runs)).toEqual([expect.objectContaining({
      backend: "typescript",
      elapsedMedianMs: 20,
      rssPeakMedianBytes: 200,
    })])
    expect(() => summarizeValidationRuns([
      run("typescript", 1, 10),
      { ...run("rust", 1, 10), diagnosticsDigest: "other" },
    ])).toThrow(/диагностик/u)
  })
})

function run(backend: "typescript" | "rust", runNumber: number, elapsedMs: number) {
  return {
    backend,
    run: runNumber,
    elapsedMs,
    cpuUserMicros: 1,
    cpuSystemMicros: 2,
    rssPeakBytes: elapsedMs * 10,
    heapUsedBytes: 4,
    externalBytes: 5,
    arrayBuffersBytes: 6,
    snapshotBytes: 7,
    diagnosticsDigest: "same",
    diagnostics: 8,
    nativeDiagnostics: 0,
    deferredChecks: 9,
    pages: 1,
    maxNativeTemporaryBytes: 10,
  } as const
}
