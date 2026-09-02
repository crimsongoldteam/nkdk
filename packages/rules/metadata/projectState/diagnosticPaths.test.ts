import type { Diagnostic } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { assertProjectDiagnosticPaths } from "./diagnosticPaths"

const diagnostic = (filePath: string): Diagnostic => ({
  filePath,
  line: 1,
  col: 1,
  severity: "error",
  source: "structure",
  message: "Ошибка",
})

describe("пути диагностик ProjectState", () => {
  it("сохраняет нормализованный относительный путь", () => {
    const diagnostics = [diagnostic("cfe/Расширение/Форма.yaml")]

    expect(assertProjectDiagnosticPaths(diagnostics, "test-validator")).toBe(diagnostics)
  })

  it.each([
    "C:\\project\\cfe\\Расширение\\Форма.yaml",
    "/project/cfe/Расширение/Форма.yaml",
    "cfe\\Расширение\\Форма.yaml",
    "cfe/../Форма.yaml",
  ])("отклоняет недопустимый путь %s", (filePath) => {
    expect(() => assertProjectDiagnosticPaths([diagnostic(filePath)], "test-validator"))
      .toThrow(`test-validator вернул недопустимый путь диагностики ${JSON.stringify(filePath)}`)
  })
})
