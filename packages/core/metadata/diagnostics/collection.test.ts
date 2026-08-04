import { describe, expect, it } from "vitest"
import { createDiagnosticBatchWriter, openDiagnosticBatch } from "./binaryBatch"
import { createMetadataDiagnosticCollection } from "./collection"
import type { MetadataDiagnostic } from "../validation/types"

describe("двоичная коллекция диагностик", () => {
  it("сортирует записи, удаляет полные дубли и считает важность", () => {
    const collection = createMetadataDiagnosticCollection([
      batch([
        diagnostic({ filePath: "cf/Б.yaml", line: 2, severity: "warning", message: "Б" }),
      ]),
      batch([
        diagnostic({ filePath: "cf/А.yaml", line: 1, severity: "error", message: "А" }),
      ]),
      batch([
        diagnostic({ filePath: "cf/А.yaml", line: 1, severity: "error", message: "А" }),
      ]),
    ])

    expect([...collection]).toEqual([
      diagnostic({ filePath: "cf/А.yaml", line: 1, severity: "error", message: "А" }),
      diagnostic({ filePath: "cf/Б.yaml", line: 2, severity: "warning", message: "Б" }),
    ])
    expect({ count: collection.count, errors: collection.errors, warnings: collection.warnings })
      .toEqual({ count: 2, errors: 1, warnings: 1 })
  })

  it("учитывает source, path и code при удалении дублей", () => {
    const common = diagnostic({ filePath: "cf/А.yaml", line: 1, severity: "error", message: "А" })
    const collection = createMetadataDiagnosticCollection([batch([
      common,
      { ...common, source: "reference", path: "/Тип", code: "missing_reference" },
    ])])

    expect(collection.count).toBe(2)
  })

  it("после освобождения забывает источники и запрещает обход", () => {
    const collection = createMetadataDiagnosticCollection([batch([diagnostic()])])
    const iterator = collection[Symbol.iterator]()

    collection.release()

    expect(collection.released).toBe(true)
    expect(() => [...collection]).toThrow(/освобождена/)
    expect(() => iterator.next()).toThrow(/освобождена/)
    expect(() => collection.release()).not.toThrow()
  })

  it("не декодирует записи до первого обращения к содержимому", () => {
    const source = batch([diagnostic()])
    let reads = 0
    const collection = createMetadataDiagnosticCollection([{
      count: source.count,
      diagnostic(index) {
        reads += 1
        return source.diagnostic(index)
      },
    }])

    expect(reads).toBe(0)
    expect([...collection]).toEqual([diagnostic()])
    expect(reads).toBeGreaterThan(0)
  })

  it("освобождает непрочитанную коллекцию без декодирования", () => {
    let reads = 0
    const collection = createMetadataDiagnosticCollection([{
      count: 1,
      diagnostic() {
        reads += 1
        return diagnostic()
      },
    }])

    collection.release()

    expect(reads).toBe(0)
    expect(() => collection.count).toThrow(/освобождена/)
  })
})

function batch(diagnostics: readonly MetadataDiagnostic[]) {
  const writer = createDiagnosticBatchWriter()
  diagnostics.forEach((value) => writer.append(value))
  return openDiagnosticBatch(writer.finish())
}

function diagnostic(overrides: Partial<MetadataDiagnostic> = {}): MetadataDiagnostic {
  return {
    filePath: "cf/А.yaml",
    line: 1,
    col: 1,
    severity: "error",
    source: "structure",
    message: "Ошибка",
    ...overrides,
  }
}
