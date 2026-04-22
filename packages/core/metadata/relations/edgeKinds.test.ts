import { describe, expect, it } from "vitest"
import { isOwning, registerEdgeKind } from "./edgeKinds"

describe("edgeKinds — isOwning", () => {
  describe("owning kinds → true", () => {
    it.each([
      "Реквизит",
      "ТабличнаяЧасть",
      "СтандартныйРеквизит",
      "ЗначениеПеречисления",
      "MetadataCatalog",
      "MetadataDocument",
      "MetadataEnumeration",
      "Родитель",
    ])("%s → true", (kind) => {
      expect(isOwning(kind)).toBe(true)
    })
  })

  describe("reference kinds → false", () => {
    it.each(["Тип"])("%s → false", (kind) => {
      expect(isOwning(kind)).toBe(false)
    })
  })

  it("бросает для неизвестного kind", () => {
    expect(() => isOwning("НеизвестныйВид")).toThrow(/неизвестный kind/)
  })
})

describe("registerEdgeKind", () => {
  it("регистрирует новый owning-вид", () => {
    registerEdgeKind("ТестОбъект", { owning: true })
    expect(isOwning("ТестОбъект")).toBe(true)
  })

  it("регистрирует новый reference-вид", () => {
    registerEdgeKind("ТестСсылка", { owning: false })
    expect(isOwning("ТестСсылка")).toBe(false)
  })
})
