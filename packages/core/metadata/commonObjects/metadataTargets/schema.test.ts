import { describe, expect, it } from "vitest"
import type { TSchema } from "@sinclair/typebox"
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

  it("keeps object examples inside allowed roots", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["Enum"] })

    expect(schema.examples).toEqual(["Перечисление.ИмяПеречисления"])
    expectMatches(schema, "Перечисление.ИмяПеречисления")
    expectNotMatches(schema, "Справочник.ИмяСправочника")
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

  it("restricts field service segments by fieldKinds", () => {
    const schema = buildMetadataTargetSchema({
      kind: "field",
      owner: "explicit",
      roots: ["Catalog"],
      fieldKinds: ["Attribute"],
    })

    expect(schema.examples).toEqual(["Справочник.Номенклатура.Реквизит.Артикул"])
    expectMatches(schema, "Справочник.Номенклатура.Реквизит.Артикул")
    expectNotMatches(schema, "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество")
    expect(String(schema.description)).not.toContain("ТабличнаяЧасть")
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

  it("does not accept EmptyRef when allowEmptyRef is false", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Catalog"],
      valueKinds: ["predefinedValue", "emptyRef"],
      allowEmptyRef: false,
    })

    expect(schema.examples).toEqual(["Справочник.СтавкиНДС.БезНДС"])
    expectMatches(schema, "Справочник.СтавкиНДС.БезНДС")
    expectNotMatches(schema, "Справочник.СтавкиНДС.ПустаяСсылка")
  })

  it("describes enum values without predefined examples", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Enum"],
      valueKinds: ["enumValue"],
    })

    expect(schema.examples).toEqual(["Перечисление.ИмяПеречисления.ИмяЗначения"])
    expectMatches(schema, "Перечисление.ИмяПеречисления.ИмяЗначения")
    expectNotMatches(schema, "Справочник.СтавкиНДС.БезНДС")
    expectNotMatches(schema, "Перечисление.ИмяПеречисления.ПустаяСсылка")
  })

  it("does not describe value kinds made impossible by roots", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Catalog"],
      valueKinds: ["enumValue"],
    })

    expect(schema.examples).toEqual([])
    expectNotMatches(schema, "Перечисление.ИмяПеречисления.ИмяЗначения")
    expect(String(schema.description)).toContain("ограничение не разрешает значения")
    expect(String(schema.description)).not.toContain("Перечисление")
  })

  it("keeps value descriptions inside allowed roots", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Document"],
      valueKinds: ["predefinedValue"],
    })

    expect(schema.examples).toEqual(["Документ.ИмяОбъекта.ИмяПредопределенногоЗначения"])
    expectMatches(schema, "Документ.ИмяОбъекта.ИмяПредопределенногоЗначения")
    expectNotMatches(schema, "Справочник.СтавкиНДС.БезНДС")
    expect(String(schema.description)).toContain("Документ.<ИмяОбъекта>.<ИмяПредопределенногоЗначения>")
    expect(String(schema.description)).not.toContain("Справочник")
  })

  it("returns constrained schema for metadata type strings", () => {
    const schema = buildMetadataTargetSchema({
      kind: "type",
      roots: ["Catalog"],
      typeKinds: ["ref", "primitive"],
      primitives: ["string", "boolean"],
    })

    expect(schema).toMatchObject({
      type: "string",
      examples: ["Справочник.ИмяСправочника", "Строка", "Булево"],
    })
    expectMatches(schema, "Справочник.ИмяСправочника")
    expectMatches(schema, "Строка(10)")
    expectMatches(schema, "Булево")
    expectNotMatches(schema, "Документ.ИмяДокумента")
    expectNotMatches(schema, "Число")
    expect(String(schema.description)).not.toContain("широкие типы")
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })

  it("returns constrained schema for form data paths", () => {
    const schema = buildMetadataTargetSchema({
      kind: "dataPath",
      context: "form",
      allowedKinds: ["string"],
      allowComposite: false,
    })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*(?:\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*)*$",
      examples: ["ИмяРеквизита", "ИмяТаблицы.ИмяКолонки"],
    })
    expect(String(schema.description)).toContain("string")
  })

  it("returns constrained schema for local child names", () => {
    const formSchema = buildMetadataTargetSchema({ kind: "localChild", owner: "this", childKind: "Form" })
    const templateSchema = buildMetadataTargetSchema({ kind: "localChild", owner: "this", childKind: "Template" })

    expect(formSchema).toMatchObject({
      type: "string",
      pattern: "^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
      examples: ["ИмяФормы"],
    })
    expect(templateSchema).toMatchObject({
      type: "string",
      pattern: "^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
      examples: ["ИмяМакета"],
    })
  })
})

function expectMatches(schema: TSchema & { pattern?: string }, value: string): void {
  expect(new RegExp(String(schema.pattern)).test(value)).toBe(true)
}

function expectNotMatches(schema: TSchema & { pattern?: string }, value: string): void {
  expect(new RegExp(String(schema.pattern)).test(value)).toBe(false)
}
