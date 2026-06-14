import { describe, expect, it } from "vitest"
import { buildMetadataTargetSchema } from "./index"

describe("buildMetadataTargetSchema", () => {
  it("returns ordinary JSON Schema for object references", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["Catalog", "Document"] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^((Справочник|Документ)\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*)$",
      examples: ["Справочник.Контрагенты", "Документ.ЗаказПокупателя"],
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })

  it("describes full field paths with service segments", () => {
    const schema = buildMetadataTargetSchema({ kind: "field", owner: "explicit", roots: ["Catalog"] })

    expect(schema).toMatchObject({
      type: "string",
      examples: [
        "Справочник.Номенклатура.Реквизит.Артикул",
        "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      ],
    })
    expect(String(schema.description)).toContain("служебные сегменты")
  })

  it("describes predefined values and EmptyRef without project names", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Catalog"],
      valueKinds: ["predefinedValue", "emptyRef"],
      allowEmptyRef: true,
    })

    expect(schema).toMatchObject({
      type: "string",
      examples: ["Справочник.СтавкиНДС.БезНДС", "Справочник.СтавкиНДС.ПустаяСсылка"],
    })
    expect(String(schema.description)).toContain("<ИмяСправочника>")
  })
})
