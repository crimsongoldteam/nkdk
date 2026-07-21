import { describe, expect, it } from "vitest"
import { createStringPool } from "./stringPool"

describe("configuration index string pool", () => {
  it("deduplicates and keeps first-seen order", () => {
    const pool = createStringPool(["Я", "A", "Б", "A"])
    const expected = ["Я", "A", "Б"]
    expect(pool.strings).toEqual(expected)
    expect(pool.id("A")).toBe(expected.indexOf("A") + 1)
  })

  it("rejects missing and NUL-containing strings", () => {
    const pool = createStringPool(["known"])
    expect(() => pool.id("missing")).toThrow("Строка отсутствует в STRINGS")
    expect(() => createStringPool(["bad\0value"])).toThrow("U+0000")
  })
})
