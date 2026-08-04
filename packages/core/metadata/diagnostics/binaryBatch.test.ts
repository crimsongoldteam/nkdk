import { describe, expect, it } from "vitest"
import {
  createDiagnosticBatchWriter,
  openDiagnosticBatch,
  type EncodedDiagnosticBatch,
} from "./binaryBatch"

describe("двоичная пачка диагностик", () => {
  it("сохраняет диагностики без промежуточного JSON-представления", () => {
    const writer = createDiagnosticBatchWriter()
    writer.append({
      filePath: "cf/Справочники/Товары.yaml",
      line: 4,
      col: 7,
      severity: "error",
      source: "reference",
      code: "missing_reference",
      value: "Справочник.Товары",
      path: "/Реквизиты/0/Тип",
      message: "Не найдена ссылка",
    })
    writer.append({
      filePath: "cf/Справочники/Товары.yaml",
      line: 8,
      col: 3,
      severity: "warning",
      source: "structure",
      message: "Неиспользуемое значение",
    })

    const expectedByteLength = writer.byteLength
    const batch = writer.finish()
    const view = openDiagnosticBatch(batch)

    expect(batch.bytes.byteLength).toBe(expectedByteLength)
    expect(view.count).toBe(2)
    expect(view.diagnostic(0)).toEqual({
      filePath: "cf/Справочники/Товары.yaml",
      line: 4,
      col: 7,
      severity: "error",
      source: "reference",
      code: "missing_reference",
      value: "Справочник.Товары",
      path: "/Реквизиты/0/Тип",
      message: "Не найдена ссылка",
    })
    expect(view.diagnostic(1)).toEqual({
      filePath: "cf/Справочники/Товары.yaml",
      line: 8,
      col: 3,
      severity: "warning",
      source: "structure",
      message: "Неиспользуемое значение",
    })
  })

  it.each([
    ["чужой magic", (bytes: Uint8Array<ArrayBuffer>) => new DataView(bytes.buffer).setUint32(0, 0, true)],
    ["чужую версию", (bytes: Uint8Array<ArrayBuffer>) => new DataView(bytes.buffer).setUint16(4, 2, true)],
    ["лишние байты", (bytes: Uint8Array<ArrayBuffer>) => {
      const extended = new Uint8Array(bytes.byteLength + 1)
      extended.set(bytes)
      return extended
    }],
  ])("отклоняет %s", (_name, corrupt) => {
    const batch = encodedDiagnostic()
    const replacement = corrupt(batch.bytes)

    expect(() => openDiagnosticBatch(replacement === undefined ? batch : { bytes: replacement }))
      .toThrow()
  })

  it("отклоняет представление, которое не владеет всем ArrayBuffer", () => {
    const batch = encodedDiagnostic()
    const container = new Uint8Array(batch.bytes.byteLength + 2)
    container.set(batch.bytes, 1)
    const slicedView = new Uint8Array(container.buffer, 1, batch.bytes.byteLength)

    expect(() => openDiagnosticBatch({ bytes: slicedView })).toThrow(/владе/)
  })

  it("не позволяет использовать writer после завершения", () => {
    const writer = createDiagnosticBatchWriter()
    writer.append(diagnostic())
    writer.finish()

    expect(() => writer.append(diagnostic())).toThrow(/заверш/)
  })
})

function encodedDiagnostic(): EncodedDiagnosticBatch {
  const writer = createDiagnosticBatchWriter()
  writer.append(diagnostic())
  return writer.finish()
}

function diagnostic() {
  return {
    filePath: "cf/А.yaml",
    line: 1,
    col: 2,
    severity: "error" as const,
    source: "structure" as const,
    message: "Ошибка",
  }
}
