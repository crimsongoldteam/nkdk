import { describe, expect, it } from "vitest"
import {
  decodeRustFileBaselineResponse,
  encodeRustFileBaselineRequest,
  encodeRustFileComparisonRequest,
  encodeRustTargetRequest,
} from "./protocol"

describe("двоичный протокол Rust ProjectState", () => {
  it.each([
    [1, encodeRustFileBaselineRequest(["cf/Я.yaml"])],
    [2, encodeRustFileComparisonRequest([{
      projectPath: "cf/Я.yaml",
      componentPath: "cf",
      hash: 1n,
      resourceKind: "yaml",
      yamlRole: "configuration",
    }])],
    [3, encodeRustTargetRequest([{
      componentPath: "cf",
      canonicalTarget: "Catalog.Я",
    }])],
  ])("кодирует версию 1.0 и операцию %i", (operation, bytes) => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    expect(view.getUint32(0, true)).toBe(0x5153_4b4e)
    expect(view.getUint16(4, true)).toBe(1)
    expect(view.getUint16(6, true)).toBe(0)
    expect(view.getUint16(8, true)).toBe(operation)
  })

  it("отклоняет оборванный ответ", () => {
    expect(() => decodeRustFileBaselineResponse(new Uint8Array(4))).toThrow(/оборван/u)
  })
})
