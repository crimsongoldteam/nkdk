import { describe, expect, it } from "vitest"
import {
  BulkPropertyType,
  encodeEdgeBlobs,
  encodeBulkHeader,
  encodeBulkValue,
  encodeNodeBlobs,
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

  it("кодирует отсутствующее свойство как GRAPH.BULK NULL", () => {
    expect([...encodeBulkValue(null).values()]).toEqual([BulkPropertyType.Null])
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

describe("bulk blob encoder", () => {
  it("кодирует node blob с header и свойствами в стабильном порядке", () => {
    const blobs = encodeNodeBlobs("MetadataCatalog", [
      { id: 0, logicalId: "A", props: { id: "A", name: "A", enabled: true } },
      { id: 1, logicalId: "B", props: { id: "B", name: "B", enabled: false } },
    ])

    expect(blobs).toHaveLength(1)
    expect(blobs[0]!.count).toBe(2)
    expect(blobs[0]!.buffer.toString("utf8")).toContain("MetadataCatalog\0")
    expect(blobs[0]!.buffer.toString("utf8")).toContain("enabled\0")
    expect(blobs[0]!.buffer.toString("utf8")).toContain("id\0")
    expect(blobs[0]!.buffer.toString("utf8")).toContain("name\0")
  })

  it("разбивает blob при конфликте типов одного свойства", () => {
    const blobs = encodeNodeBlobs("MetadataCatalog", [
      { id: 0, logicalId: "A", props: { id: "A", value: "1" } },
      { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
    ])

    expect(blobs).toHaveLength(2)
    expect(blobs.map((blob) => blob.count)).toEqual([1, 1])
  })

  it("кодирует edge blob с source и target numeric IDs", () => {
    const blobs = encodeEdgeBlobs("VALUE", [
      { src: 0, tgt: 1, props: { yaml: "Реквизит", index: 2 } },
    ])

    expect(blobs).toHaveLength(1)
    const buffer = blobs[0]!.buffer
    const headerEnd = buffer.indexOf("yaml\0", "utf8") + Buffer.byteLength("yaml\0")
    expect(buffer.readBigUInt64LE(headerEnd)).toBe(0n)
    expect(buffer.readBigUInt64LE(headerEnd + 8)).toBe(1n)
  })
})
