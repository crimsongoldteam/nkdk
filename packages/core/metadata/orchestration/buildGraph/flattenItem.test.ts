import { describe, expect, it } from "vitest"
import { flattenItem } from "./flattenItem"

describe("flattenItem", () => {
  it("возвращает {} для undefined item", () => {
    expect(flattenItem(undefined)).toEqual({})
  })

  it("выкидывает itemType (он уезжает в label)", () => {
    expect(flattenItem({ itemType: "MetadataCatalog", name: "К" })).toEqual({
      p_name: "К",
    })
  })

  it("выкидывает _uuid (служебный, не пишется в граф)", () => {
    expect(flattenItem({ _uuid: "abc-123", code: "001" })).toEqual({
      p_code: "001",
    })
  })

  it("раскладывает скаляры под префиксом p_", () => {
    expect(
      flattenItem({
        codeLength: 9,
        hierarchical: true,
        comment: "abc",
        nullField: null,
      }),
    ).toEqual({
      p_codeLength: 9,
      p_hierarchical: true,
      p_comment: "abc",
      p_nullField: null,
    })
  })

  it("сплющивает plain-объекты по '_'", () => {
    expect(
      flattenItem({
        numberQualifiers: { digits: 10, fractionDigits: 2 },
        synonym: { items: { ru: "Контрагенты", en: "Contractors" } },
      }),
    ).toEqual({
      p_numberQualifiers_digits: 10,
      p_numberQualifiers_fractionDigits: 2,
      p_synonym_items_ru: "Контрагенты",
      p_synonym_items_en: "Contractors",
    })
  })

  it("оставляет массивы примитивов как есть (под префиксом p_)", () => {
    expect(flattenItem({ types: ["Number", "String"] })).toEqual({
      p_types: ["Number", "String"],
    })
  })

  it("выкидывает массивы объектов (они уезжают в отдельные узлы через рёбра)", () => {
    expect(
      flattenItem({
        choiceParameters: [{ name: "A" }, { name: "B" }],
        codeLength: 5,
      }),
    ).toEqual({
      p_codeLength: 5,
    })
  })

  it("выкидывает пустые массивы (нет смысла хранить)", () => {
    expect(flattenItem({ types: [], codeLength: 5 })).toEqual({
      p_codeLength: 5,
    })
  })

  it("игнорирует undefined-значения", () => {
    expect(flattenItem({ codeLength: undefined, name: "К" })).toEqual({
      p_name: "К",
    })
  })

  it("кладёт массивы примитивов с null-элементами как есть", () => {
    expect(flattenItem({ tags: ["a", null, "b"] })).toEqual({
      p_tags: ["a", null, "b"],
    })
  })
})
