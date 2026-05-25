import { describe, expect, it } from "vitest"
import {
  BulkPropertyType,
  encodeBulkHeader,
  encodeBulkValue,
  normalizeBulkProperties,
} from "../../src/bulk/encoder"

const bytes = (buffer: Buffer): number[] => [...buffer.values()]

describe("bulk encoder", () => {
  it("кодирует boolean, long, double и string в GRAPH.BULK формат", () => {
    expect(bytes(encodeBulkValue(true))).toEqual([BulkPropertyType.Bool, 1])

    const long = encodeBulkValue(42)
    expect(long.readUInt8(0)).toBe(BulkPropertyType.Long)
    expect(long.readBigInt64LE(1)).toBe(42n)

    const double = encodeBulkValue(1.5)
    expect(double.readUInt8(0)).toBe(BulkPropertyType.Double)
    expect(double.readDoubleLE(1)).toBe(1.5)

    expect(encodeBulkValue("абв").subarray(0, 1).readUInt8(0)).toBe(BulkPropertyType.String)
    expect(encodeBulkValue("абв").subarray(1).toString("utf8")).toBe("абв\0")
  })

  it("кодирует массивы одного типа и пропускает null-значения при нормализации", () => {
    expect(normalizeBulkProperties({ a: null, b: [null], c: ["x", null, "y"] })).toEqual({
      c: ["x", "y"],
    })

    const encoded = encodeBulkValue(["x", "y"])
    expect(encoded.readUInt8(0)).toBe(BulkPropertyType.Array)
    expect(encoded.readBigInt64LE(1)).toBe(2n)
    expect(encoded.subarray(9).includes(0)).toBe(true)
  })

  it("создаёт header с именем сущности и именами свойств", () => {
    const encoded = encodeBulkHeader("MetadataCatalog", ["id", "name"])
    expect(encoded.toString("utf8")).toContain("MetadataCatalog\0")
    expect(encoded.toString("utf8")).toContain("id\0")
    expect(encoded.toString("utf8")).toContain("name\0")
    expect(encoded.readUInt32LE(Buffer.byteLength("MetadataCatalog") + 1)).toBe(2)
  })
})
