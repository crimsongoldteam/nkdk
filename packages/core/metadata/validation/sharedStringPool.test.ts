import { describe, expect, it } from "vitest"
import { createSharedStringPool, createSharedStringPoolView } from "./sharedStringPool"

describe("SharedStringPool", () => {
  it("deduplicates strings and restores UTF-8 values by id", () => {
    const pool = createSharedStringPool(["Справочник", "Номенклатура", "Справочник", "", "Артикул"])
    const view = createSharedStringPoolView(pool)

    expect(pool.count).toBe(4)
    expect(pool.idByValue.get("Справочник")).toBe(0)
    expect(pool.idByValue.get("Номенклатура")).toBe(1)
    expect(pool.idByValue.get("")).toBe(2)
    expect(pool.idByValue.get("Артикул")).toBe(3)
    expect(view.get(0)).toBe("Справочник")
    expect(view.get(1)).toBe("Номенклатура")
    expect(view.get(2)).toBe("")
    expect(view.get(3)).toBe("Артикул")
  })

  it("throws for an invalid string id", () => {
    const pool = createSharedStringPool(["Справочник"])
    const view = createSharedStringPoolView(pool)

    expect(() => view.get(1)).toThrow("Некорректный string id")
  })
})
