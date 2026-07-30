import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "./encode"
import { sampleSnapshot, TEST_UUID } from "./testData"
import { createStringPool } from "./stringPool"

describe("configuration index string pool", () => {
  it("устраняет повторы и сохраняет порядок первого использования", () => {
    const pool = createStringPool(["Я", "A", "Б", "A"])
    const expected = ["Я", "A", "Б"]
    expect(pool.strings).toEqual(expected)
    expect(pool.id("A")).toBe(expected.indexOf("A") + 1)
  })

  it("отклоняет отсутствующие строки и U+0000", () => {
    const pool = createStringPool(["known"])
    expect(() => pool.id("missing")).toThrow("Строка отсутствует в STRINGS")
    expect(() => createStringPool(["bad\0value"])).toThrow("U+0000")
  })

  it("не помещает двоичный UUID и неиспользуемые значения в STRINGS снимка", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())
    const directoryEntry = 64 + 64
    const offset = Number(encoded.readBigUInt64LE(directoryEntry + 16))
    const length = Number(encoded.readBigUInt64LE(directoryEntry + 24))
    const strings = encoded.subarray(offset, offset + length).toString("utf8")

    expect(strings).not.toContain(TEST_UUID)
    expect(strings).not.toContain("producerVersion")
  })
})
