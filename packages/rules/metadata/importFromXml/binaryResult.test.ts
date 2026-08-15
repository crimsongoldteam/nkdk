import { describe, expect, it } from "vitest"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import {
  createImportBinaryResult,
  importDiagnostic,
  openImportBinaryResult,
} from "./binaryResult"

const transferableSymbol = Symbol.for("Piscina.transferable")

describe("двоичный результат import", () => {
  it("передаёт diagnostics, файлы, индекс и состояние отдельными буферами", () => {
    const state = createProjectStateFragmentWriter()
    state.appendImportFinal({
      updates: [{
        kind: "resource",
        projectPath: "cf/Картинка.png",
        componentPath: "cf",
        resourceKind: "resource",
        targets: [],
      }],
      hashBytes: new Uint8Array(8),
    })
    const result = createImportBinaryResult({
      diagnostics: [{
        severity: "error",
        code: "broken_xml",
        message: "XML повреждён",
        targetProjectPath: "Справочник/Товары.yaml",
        sourcePath: "/xml/Catalog.xml",
      }],
      warnings: [{
        severity: "warning",
        code: "unknown_value",
        message: "Значение не найдено",
        targetProjectPath: "Справочник/Товары.yaml",
        value: "СтароеЗначение",
      }],
      files: [
        { sourceKind: "worker", sourcePath: "/out/Товары.yaml", targetProjectPath: "Справочник/Товары.yaml" },
        { sourceKind: "xml", sourcePath: "/xml/picture.png", targetProjectPath: "Картинка.png" },
      ],
      configurationFragments: [{ targetProjectPath: "Справочник/Товары.yaml", entities: [] }],
      stateFragment: state.finish(),
    })

    const view = openImportBinaryResult(result)
    expect(importDiagnostic(view.diagnostics, 0)).toEqual({
      severity: "error",
      code: "broken_xml",
      message: "XML повреждён",
      targetProjectPath: "Справочник/Товары.yaml",
      sourcePath: "/xml/Catalog.xml",
    })
    expect(importDiagnostic(view.warnings, 0)).toEqual({
      severity: "warning",
      code: "unknown_value",
      message: "Значение не найдено",
      targetProjectPath: "Справочник/Товары.yaml",
      value: "СтароеЗначение",
    })
    expect(Array.from({ length: view.files.count }, (_, index) => view.files.file(index))).toEqual([
      { sourceKind: "worker", sourcePath: "/out/Товары.yaml", targetProjectPath: "Справочник/Товары.yaml" },
      { sourceKind: "xml", sourcePath: "/xml/picture.png", targetProjectPath: "Картинка.png" },
    ])
    expect(view.configurationFragmentBuffer).toBeInstanceOf(ArrayBuffer)
    expect(view.stateFragment).toBeDefined()

    const movable = createMovableBinaryResult(result) as unknown as {
      readonly [transferableSymbol]: readonly ArrayBuffer[]
    }
    expect(new Set(movable[transferableSymbol])).toEqual(new Set(result.buffers.map(({ buffer }) => buffer)))
  })

  it("отклоняет повреждённую секцию до чтения результата", () => {
    const result = createImportBinaryResult({ diagnostics: [], files: [] })
    const files = result.buffers.find(({ name }) => name === "files")!
    new DataView(files.buffer).setUint32(12, 0, true)

    expect(() => openImportBinaryResult(result)).toThrow(/файлов import/)
  })
})
