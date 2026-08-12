import { openDiagnosticBatch } from "@nkdk/runtime"
import { decodeRustDeferredValidationPage } from "../../rules/metadata/projectState/rust/dependencyProtocol"
import { describe, expect, it } from "vitest"
import { nativeTestDiagnosticBatch, openProjectStateReader } from "../index.js"
import {
  deferredValidationSnapshot,
  readinessSnapshot,
  sectionViews,
  unsortedDeferredValidationSnapshot,
} from "./project-state-fixture.mjs"

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
      blockedExtensionDiagnostic(),
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

    expect(decodeDiagnostics(page.diagnostics)).toEqual([blockedExtensionDiagnostic()])
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

  it("выдаёт отложенные строки детерминированными страницами", () => {
    const reader = openProjectStateReader(sectionViews(deferredValidationSnapshot()))

    const first = reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 2 })
    const second = reader.validateDependencyPage({
      projectDir: "/project",
      cursor: 2,
      batchSize: 2,
    })

    expect(decodeRustDeferredValidationPage(first.deferred)).toEqual([
      { kind: "pendingReference", fileId: 0, rowId: 0 },
      { kind: "pendingCheck", fileId: 0, rowId: 0 },
    ])
    expect(first.nextCursor).toBe(2)
    expect(first.stats).toMatchObject({ checksVisited: 2, deferredChecks: 2 })
    expect(decodeRustDeferredValidationPage(second.deferred)).toEqual([
      { kind: "structuredDocument", fileId: 0, rowId: 0 },
    ])
    expect(second.nextCursor).toBeUndefined()
    expect(second.stats).toMatchObject({ checksVisited: 1, deferredChecks: 1 })
    reader.close()
  })

  it("не требует физической сортировки строк снимка по файлу", () => {
    const reader = openProjectStateReader(sectionViews(unsortedDeferredValidationSnapshot()))

    const page = reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 2 })

    expect(decodeRustDeferredValidationPage(page.deferred)).toEqual([
      { kind: "pendingReference", fileId: 0, rowId: 1 },
      { kind: "pendingCheck", fileId: 0, rowId: 1 },
    ])
    reader.close()
  })

  it("строит компактный план один раз и последовательно отдаёт страницы", () => {
    const reader = openProjectStateReader(sectionViews(deferredValidationSnapshot()))
    const plan = reader.planDependencyValidation({ projectDir: "/project", batchSize: 2 })

    const first = plan.nextPage()
    const second = plan.nextPage()

    expect(decodeRustDeferredValidationPage(first.deferred)).toHaveLength(2)
    expect(first.nextCursor).toBe(2)
    expect(decodeRustDeferredValidationPage(second.deferred)).toHaveLength(1)
    expect(second.nextCursor).toBeUndefined()
    plan.close()
    expect(() => plan.nextPage()).toThrow(/закрыт/u)
    reader.close()
  })
})

function decodeDiagnostics(bytes: Uint8Array<ArrayBuffer>) {
  const view = openDiagnosticBatch({ bytes })
  return Array.from({ length: view.count }, (_, index) => view.diagnostic(index))
}

function blockedExtensionDiagnostic() {
  return {
    filePath: "/project/cfe/demo/Конфигурация.yaml",
    line: 1,
    col: 1,
    severity: "error" as const,
    source: "cross-file" as const,
    message: "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
  }
}
