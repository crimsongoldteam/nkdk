import { openDiagnosticBatch } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { nativeTestDiagnosticBatch } from "../index.js"

describe("Rust ProjectState dependency validation", () => {
  it("кодирует диагностику в общий двоичный формат runtime", () => {
    const bytes = nativeTestDiagnosticBatch()
    const view = openDiagnosticBatch({ bytes })

    expect(Array.from({ length: view.count }, (_, index) => view.diagnostic(index))).toEqual([{
      filePath: "/project/cf/Конфигурация.yaml",
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      message: "Базовая конфигурация cf не найдена",
    }])
  })
})
