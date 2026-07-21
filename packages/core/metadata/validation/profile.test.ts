import { describe, expect, it, vi } from "vitest"
import { createOperationProfiler } from "./profile"

describe("validation profile", () => {
  it("records main-thread measurements with time and memory", () => {
    const profiler = createOperationProfiler({ operation: "validation", scope: { scope: "main" } })

    const result = profiler.measure("Подготовка YAML-проекта", "Поиск файлов проекта", { items: 2 }, () => 42)

    expect(result).toBe(42)
    expect(profiler.records()).toEqual([
      expect.objectContaining({
        operation: "validation",
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

  it("prints strict worker records only when operation profiling is enabled", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_PROFILE"]
    let line = ""
    process.env["NKDK_PROFILE"] = "1"
    try {
      const profiler = createOperationProfiler({ operation: "import-from-xml", scope: { scope: "worker", workerIndex: 3 } })
      profiler.measure("Подготовка YAML-проекта", "Разбор YAML", { items: 5 }, () => undefined)
      profiler.flush()
      line = error.mock.calls.map(([message]) => String(message)).find((message) => message.startsWith("[nkdk-profile-step]")) ?? ""
    } finally {
      if (previous === undefined) delete process.env["NKDK_PROFILE"]
      else process.env["NKDK_PROFILE"] = previous
      error.mockRestore()
    }

    expect(line).toContain("[nkdk-profile-step]")
    expect(line).toContain('operation="import-from-xml"')
    expect(line).toContain('step="Подготовка YAML-проекта"')
    expect(line).toContain('substep="Разбор YAML"')
    expect(line).toContain("scope=worker")
    expect(line).toContain("worker=3")
    expect(line).toContain("items=5")
    expect(line).toMatch(/time=\d+\.\d+ms/)
    expect(line).toMatch(/rssPeak=\d+\.\d+MiB/)
  })
})
