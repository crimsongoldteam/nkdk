import { describe, expect, it, vi } from "vitest"
import { createValidationProfiler } from "./profile"

describe("validation profile", () => {
  it("records main-thread measurements with time and memory", () => {
    const profiler = createValidationProfiler({ scope: "main" })

    const result = profiler.measure("Подготовка YAML-проекта", "Поиск файлов проекта", { items: 2 }, () => 42)

    expect(result).toBe(42)
    expect(profiler.records()).toEqual([
      expect.objectContaining({
        step: "Подготовка YAML-проекта",
        substep: "Поиск файлов проекта",
        scope: "main",
        items: 2,
        timeMs: expect.any(Number),
        rssStartMiB: expect.any(Number),
        rssEndMiB: expect.any(Number),
        rssPeakMiB: expect.any(Number),
        heapStartMiB: expect.any(Number),
        heapEndMiB: expect.any(Number),
        heapPeakMiB: expect.any(Number),
      }),
    ])
  })

  it("prints strict worker records only when timing is enabled", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_VALIDATION_TIMING"]
    let line = ""
    process.env["NKDK_VALIDATION_TIMING"] = "1"
    try {
      const profiler = createValidationProfiler({ scope: "worker", workerIndex: 3 })
      profiler.measure("Подготовка YAML-проекта", "Разбор YAML", { items: 5 }, () => undefined)
      profiler.flush()
      line = String(error.mock.calls[0]?.[0] ?? "")
    } finally {
      if (previous === undefined) delete process.env["NKDK_VALIDATION_TIMING"]
      else process.env["NKDK_VALIDATION_TIMING"] = previous
      error.mockRestore()
    }

    expect(line).toContain("[validation-step]")
    expect(line).toContain('step="Подготовка YAML-проекта"')
    expect(line).toContain('substep="Разбор YAML"')
    expect(line).toContain("scope=worker")
    expect(line).toContain("worker=3")
    expect(line).toContain("items=5")
    expect(line).toMatch(/time=\d+\.\d+ms/)
    expect(line).toMatch(/rssPeak=\d+\.\d+MiB/)
  })
})
