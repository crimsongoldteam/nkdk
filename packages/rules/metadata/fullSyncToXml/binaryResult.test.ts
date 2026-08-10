import { describe, expect, it } from "vitest"
import { transferableSymbol } from "piscina"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import { fragment } from "@nkdk/runtime"
import { decodeConfigurationIndexFragments } from "@nkdk/runtime"
import { createFullXmlSyncBinaryResult, openFullXmlSyncBinaryResult } from "./binaryResult"

describe("двоичный результат полной синхронизации", () => {
  it("передаёт diagnostics, пути и фрагмент индекса без предметных массивов", () => {
    const result = createFullXmlSyncBinaryResult({
      diagnostics: [{
        severity: "error",
        code: "bad_yaml",
        source: "syntax",
        message: "YAML повреждён",
        assignmentId: "catalog",
        sourceProjectPath: "Справочник/Товары.yaml",
        sourcePath: "/project/Товары.yaml",
        targetXmlPath: "Catalogs/Товары.xml",
        line: 4,
        col: 7,
      }],
      warnings: [{ severity: "warning", code: "warning", message: "Предупреждение" }],
      writtenFiles: [{ assignmentId: "catalog", targetXmlPath: "Catalogs/Товары.xml" }],
      expectedOutputs: [{ assignmentId: "catalog", targetXmlPath: "Catalogs/Товары.xml" }],
      generatedDocuments: [{
        assignmentId: "catalog",
        declarationId: "catalog-metadata",
        targetXmlPath: "Catalogs/Товары.xml",
        content: new TextEncoder().encode("<Catalog>Товары</Catalog>"),
      }],
      configurationFragments: [fragment("Справочник/Товары.yaml")],
    })

    const view = openFullXmlSyncBinaryResult(result)
    expect(view.diagnostics.diagnostic(0)).toEqual({
      severity: "error",
      code: "bad_yaml",
      source: "syntax",
      message: "YAML повреждён",
      assignmentId: "catalog",
      sourceProjectPath: "Справочник/Товары.yaml",
      sourcePath: "/project/Товары.yaml",
      targetXmlPath: "Catalogs/Товары.xml",
      line: 4,
      col: 7,
    })
    expect(view.warnings.diagnostic(0)).toMatchObject({ severity: "warning", code: "warning" })
    expect(view.writtenFiles.file(0)).toEqual({ assignmentId: "catalog", targetXmlPath: "Catalogs/Товары.xml" })
    expect(view.expectedOutputs.file(0)).toEqual({ assignmentId: "catalog", targetXmlPath: "Catalogs/Товары.xml" })
    expect(view.generatedDocuments.document(0)).toEqual({
      assignmentId: "catalog",
      declarationId: "catalog-metadata",
      targetXmlPath: "Catalogs/Товары.xml",
      content: new TextEncoder().encode("<Catalog>Товары</Catalog>"),
    })
    expect(decodeConfigurationIndexFragments(view.fragmentBuffer)).toEqual([fragment("Справочник/Товары.yaml")])

    const transferables = (createMovableBinaryResult(result) as unknown as {
      readonly [transferableSymbol]: readonly ArrayBuffer[]
    })[transferableSymbol]
    expect(transferables).toHaveLength(3)
    expect(result.buffers.every(({ buffer }) => transferables.includes(buffer))).toBe(true)
  })

  it("отклоняет повреждённую секцию до чтения результата", () => {
    const result = createFullXmlSyncBinaryResult({
      diagnostics: [], warnings: [], writtenFiles: [], expectedOutputs: [], configurationFragments: [],
    })
    const payload = result.buffers.find(({ name }) => name === "payload")!
    new DataView(payload.buffer).setUint32(24, 0, true)

    expect(() => openFullXmlSyncBinaryResult(result)).toThrow(/двоичн.*результат sync/)
  })

  it("отклоняет неверную длину и повтор документа", () => {
    const document = {
      assignmentId: "catalog",
      declarationId: "metadata",
      targetXmlPath: "Catalogs/Товары.xml",
      content: Uint8Array.of(1, 2, 3),
    }
    const damaged = createFullXmlSyncBinaryResult({
      diagnostics: [], warnings: [], writtenFiles: [], expectedOutputs: [],
      generatedDocuments: [document], configurationFragments: [],
    })
    const content = damaged.buffers.find(({ name }) => name === "document:0")!
    Object.assign(content, { buffer: new ArrayBuffer(2) })
    expect(() => openFullXmlSyncBinaryResult(damaged)).toThrow(/двоичн.*результат sync/)

    const duplicate = createFullXmlSyncBinaryResult({
      diagnostics: [], warnings: [], writtenFiles: [], expectedOutputs: [],
      generatedDocuments: [document, { ...document, content: Uint8Array.of(4) }],
      configurationFragments: [],
    })
    expect(() => openFullXmlSyncBinaryResult(duplicate)).toThrow("повтор документа")
  })
})
