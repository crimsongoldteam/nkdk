import { describe, expect, it } from "vitest"
import { decodeRustDeferredValidationPage } from "./dependencyProtocol"

describe("Rust deferred dependency validation protocol", () => {
  it("декодирует идентификаторы строк без строковых данных", () => {
    expect(decodeRustDeferredValidationPage(validDeferredPage())).toEqual([
      { kind: "pendingReference", fileId: 3, rowId: 7 },
    ])
  })

  it.each([
    ["неверный magic", (bytes: Uint8Array) => new DataView(bytes.buffer).setUint32(0, 0, true)],
    ["неверная версия", (bytes: Uint8Array) => new DataView(bytes.buffer).setUint16(4, 2, true)],
    ["неизвестный kind", (bytes: Uint8Array) => new DataView(bytes.buffer).setUint16(20, 99, true)],
    ["лишние байты", (bytes: Uint8Array) => new DataView(bytes.buffer).setUint32(16, 31, true)],
  ])("отклоняет %s", (_name, mutate) => {
    const bytes = validDeferredPage()
    mutate(bytes)
    expect(() => decodeRustDeferredValidationPage(bytes)).toThrow(/Rust deferred validation/u)
  })

  it("отклоняет оборванную строку", () => {
    expect(() => decodeRustDeferredValidationPage(validDeferredPage().subarray(0, 31)))
      .toThrow(/Rust deferred validation/u)
  })
})

function validDeferredPage(): Uint8Array {
  const bytes = new Uint8Array(32)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0x5644_4b4e, true)
  view.setUint16(4, 1, true)
  view.setUint32(8, 1, true)
  view.setUint32(12, 20, true)
  view.setUint32(16, 32, true)
  view.setUint16(20, 1, true)
  view.setUint32(24, 3, true)
  view.setUint32(28, 7, true)
  return bytes
}
