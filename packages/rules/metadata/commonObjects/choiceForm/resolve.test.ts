import { describe, expect, it } from "vitest"
import { resolveChoiceFormOwner } from "./resolve"

describe("choice form owner", () => {
  it("resolves the sole reference type", () => {
    expect(resolveChoiceFormOwner("Справочник.Товары")).toEqual({ root: "Catalog", objectName: "Товары" })
  })

  it.each([
    [["Справочник.Товары", "Документ.Заказ"]],
    ["Строка"],
    [undefined],
  ])("does not resolve composite or non-reference type %#", (type) => {
    expect(resolveChoiceFormOwner(type)).toBeUndefined()
  })
})
