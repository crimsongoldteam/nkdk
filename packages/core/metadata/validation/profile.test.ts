import { describe, expect, it, vi } from "vitest"
import { createOperationProfiler, createValidationProfileResult } from "./profile"

describe("validation profile", () => {
  it("returns project-state counters, timings, snapshot size and a stable full diagnostics digest", () => {
    const firstDiagnostic = {
      filePath: "cf/Catalogs/Products.yaml",
      line: 4,
      col: 7,
      message: "Не найдена ссылка",
      severity: "error" as const,
      source: "reference" as const,
      path: "/Реквизиты/0/Тип",
    }
    const result = createValidationProfileResult({
      diagnostics: [firstDiagnostic],
      stats: { hashedFiles: 12, parsedYamlFiles: 3, changedFiles: 4, deletedFiles: 1 },
      snapshotBytes: 4096,
      loadMs: 1.25,
      scheduleSaveMs: 0.5,
      saveBinaryMs: 2,
      discoverFilesMs: 3,
      readBaselineMs: 4,
      processFilesMs: 6,
      readLocalDiagnosticsMs: 7,
      dependencyValidationMs: 8,
    })
    const reordered = createValidationProfileResult({
      diagnostics: [{
        source: "reference",
        message: "Не найдена ссылка",
        path: "/Реквизиты/0/Тип",
        col: 7,
        severity: "error",
        line: 4,
        filePath: "cf/Catalogs/Products.yaml",
      }],
      stats: result,
      snapshotBytes: 4096,
      loadMs: 1.25,
      scheduleSaveMs: 0.5,
      saveBinaryMs: 2,
      discoverFilesMs: 3,
      readBaselineMs: 4,
      processFilesMs: 6,
      readLocalDiagnosticsMs: 7,
      dependencyValidationMs: 8,
    })

    expect(result).toMatchObject({
      hashedFiles: 12,
      parsedYamlFiles: 3,
      snapshotBytes: 4096,
      loadMs: 1.25,
      scheduleSaveMs: 0.5,
      saveBinaryMs: 2,
      processFilesMs: 6,
      dependencyValidationMs: 8,
      diagnosticsDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(reordered.diagnosticsDigest).toBe(result.diagnosticsDigest)
    expect(createValidationProfileResult({
      diagnostics: [{ ...firstDiagnostic, line: 5 }],
      stats: result,
      snapshotBytes: 4096,
      loadMs: 1.25,
      scheduleSaveMs: 0.5,
      saveBinaryMs: 2,
      discoverFilesMs: 3,
      readBaselineMs: 4,
      processFilesMs: 6,
      readLocalDiagnosticsMs: 7,
      dependencyValidationMs: 8,
    }).diagnosticsDigest).not.toBe(result.diagnosticsDigest)
  })

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

  it("aggregates repeated records by substep when requested", () => {
    const profiler = createOperationProfiler({
      operation: "import-from-xml",
      scope: { scope: "worker", workerIndex: 2 },
      aggregate: true,
    })

    profiler.record("Подготовка импорта конфигурации", "Чтение XML", { items: 2, bytes: 10, timeMs: 4 })
    profiler.record("Подготовка импорта конфигурации", "Парсинг XML", { items: 1, bytes: 10, timeMs: 3 })
    profiler.record("Подготовка импорта конфигурации", "Чтение XML", { items: 3, bytes: 20, timeMs: 6 })

    expect(profiler.records()).toEqual([
      expect.objectContaining({ substep: "Чтение XML", items: 5, bytes: 30, timeMs: 10 }),
      expect.objectContaining({ substep: "Парсинг XML", items: 1, bytes: 10, timeMs: 3 }),
    ])
  })
})
