import { describe, expect, it } from "vitest"
import { createStringPool } from "./stringPool"

describe("configuration index string pool", () => {
  it("deduplicates and sorts by raw UTF-8 bytes", () => {
    const pool = createStringPool(["Я", "A", "Б", "A"])
    const expected = ["Я", "A", "Б"].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
    expect(pool.strings).toEqual(expected)
    expect(pool.id("A")).toBe(expected.indexOf("A") + 1)
  })

  it("rejects missing and NUL-containing strings", () => {
    const pool = createStringPool(["known"])
    expect(() => pool.id("missing")).toThrow("Строка отсутствует в STRINGS")
    expect(() => createStringPool(["bad\0value"])).toThrow("U+0000")
  })
})
