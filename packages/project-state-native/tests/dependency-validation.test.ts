import { openDiagnosticBatch } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { nativeTestDiagnosticBatch, openProjectStateReader } from "../index.js"
import { readinessSnapshot, sectionViews } from "./project-state-fixture.mjs"

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

  it("сообщает об отсутствующей cf и заблокированном расширении", () => {
    const reader = openProjectStateReader(sectionViews(readinessSnapshot({ includeBase: false })))

    const page = reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 2_000 })

    expect(decodeDiagnostics(page.diagnostics)).toEqual([
      {
        filePath: "/project/cfe/demo/Конфигурация.yaml",
        line: 1,
        col: 1,
        severity: "error",
        source: "cross-file",
        message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
      },
      {
        filePath: "/project/cf/Конфигурация.yaml",
        line: 1,
        col: 1,
        severity: "error",
        source: "structure",
        message: "Базовая конфигурация cf не найдена",
      },
    ])
    reader.close()
  })

  it("блокирует расширение при неготовой базовой конфигурации", () => {
    const reader = openProjectStateReader(sectionViews(readinessSnapshot({ baseReady: false })))

    const page = reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 2_000 })

    expect(decodeDiagnostics(page.diagnostics)).toEqual([{
      filePath: "/project/cfe/demo/Конфигурация.yaml",
      line: 1,
      col: 1,
      severity: "error",
      source: "cross-file",
      message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
    }])
    reader.close()
  })

  it("отклоняет нулевую страницу и вызов после close", () => {
    const reader = openProjectStateReader(sectionViews(readinessSnapshot()))
    expect(() => reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 0 }))
      .toThrow(/batchSize/u)
    reader.close()
    expect(() => reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 1 }))
      .toThrow(/закрыт/u)
  })
})

function decodeDiagnostics(bytes: Uint8Array<ArrayBuffer>) {
  const view = openDiagnosticBatch({ bytes })
  return Array.from({ length: view.count }, (_, index) => view.diagnostic(index))
}
