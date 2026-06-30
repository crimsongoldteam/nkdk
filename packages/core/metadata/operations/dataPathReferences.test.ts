import { describe, expect, it } from "vitest"
import { rewriteDataPathSegments } from "./dataPathReferences"

describe("rewriteDataPathSegments", () => {
  it("rewrites only the resolved segment", () => {
    expect(rewriteDataPathSegments("Объект.Товары.Артикул", ["Объект", "Товары", "Артикул"], 2, "Код")).toBe(
      "Объект.Товары.Код",
    )
  })

  it("keeps indexed segments syntax around the changed segment", () => {
    expect(rewriteDataPathSegments("Товары[0].Артикул", ["Товары[0]", "Артикул"], 1, "Код")).toBe("Товары[0].Код")
  })
})
