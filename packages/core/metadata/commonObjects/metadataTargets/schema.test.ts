import { describe, expect, it } from "vitest"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import type { TSchema } from "@sinclair/typebox"
import { buildMetadataTargetSchema } from "./index"

describe("buildMetadataTargetSchema", () => {
  it("returns ordinary JSON Schema for object references", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["Catalog", "Document"] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^((Справочник|Документ)\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*)$",
      examples: ["Справочник.ИмяСправочника", "Документ.ИмяДокумента"],
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })

  it("does not accept object references when roots are empty", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: [] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^(?!)$",
      examples: [],
    })
    expectNotMatches(schema, ".ИмяОбъекта")
    expectNotMatches(schema, "Справочник.ИмяСправочника")
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
        "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита",
        "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти.Реквизит.ИмяРеквизита",
      ],
    })
    expect(String(schema.description)).toContain("конечный сегмент")
  })

  it("does not accept field paths when roots are empty", () => {
    const schema = buildMetadataTargetSchema({ kind: "field", owner: "explicit", roots: [] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^(?!)$",
      examples: [],
    })
    expectNotMatches(schema, ".ИмяОбъекта.Реквизит.ИмяРеквизита")
    expectNotMatches(schema, "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")
  })

  it("restricts field service segments by fieldKinds", () => {
    const schema = buildMetadataTargetSchema({
      kind: "field",
      owner: "explicit",
      roots: ["Catalog"],
      fieldKinds: ["Attribute", "StandardAttribute"],
    })

    expect(schema.examples).toEqual([
      "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита",
      "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти.Реквизит.ИмяРеквизита",
    ])
    expectMatches(schema, "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")
    expectMatches(
      schema,
      "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти.Реквизит.ИмяРеквизита"
    )
    expectNotMatches(schema, "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти")
    expect(String(schema.description)).toContain("ТабличнаяЧасть")
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
      examples: [
        "Справочник.ИмяСправочника.ИмяПредопределенногоЗначения",
        "Справочник.ИмяСправочника.ПустаяСсылка",
      ],
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

    expect(schema.examples).toEqual(["Справочник.ИмяСправочника.ИмяПредопределенногоЗначения"])
    expectMatches(schema, "Справочник.ИмяСправочника.ИмяПредопределенногоЗначения")
    expectNotMatches(schema, "Справочник.ИмяСправочника.ПустаяСсылка")
  })

  it("does not accept values when roots are empty even with EmptyRef allowed", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: [],
      valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
      allowEmptyRef: true,
    })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^(?!)$",
      examples: [],
    })
    expectNotMatches(schema, ".ИмяОбъекта.ПустаяСсылка")
    expectNotMatches(schema, "Справочник.ИмяСправочника.ПустаяСсылка")
    expect(String(schema.description)).toContain("ограничение не разрешает значения")
    expect(String(schema.description)).not.toContain("ПустаяСсылка")
  })

  it("describes enum values without predefined examples", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Enum"],
      valueKinds: ["enumValue"],
    })

    expect(schema.examples).toEqual(["Перечисление.ИмяПеречисления.ИмяЗначения"])
    expectMatches(schema, "Перечисление.ИмяПеречисления.ИмяЗначения")
    expectNotMatches(schema, "Справочник.ИмяСправочника.ИмяПредопределенногоЗначения")
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
    expectNotMatches(schema, "Справочник.ИмяСправочника.ИмяПредопределенногоЗначения")
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

  it("keeps primitive type schemas usable when roots are empty", () => {
    const schema = buildMetadataTargetSchema({
      kind: "type",
      roots: [],
      typeKinds: ["ref", "object", "primitive"],
      primitives: ["string"],
    })

    expect(schema.examples).toEqual(["Строка"])
    expectMatches(schema, "Строка")
    expectMatches(schema, "Строка(10)")
    expectNotMatches(schema, "Справочник.ИмяСправочника")
    expectNotMatches(schema, "Справочник")
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

  it("keeps legacy local child schema for current-owner forms", () => {
    const schema = buildMetadataTargetSchema({ kind: "localChild", owner: "this", childKind: "Form" })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("ИмяФормы")).toBe(true)
    expect(compiled.Check("Форма.ИмяФормы")).toBe(false)
  })

  it("builds local member schema for single current-owner member kind", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Form"] })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("ФормаДокумента")).toBe(true)
    expect(compiled.Check("Document.АвансовыйОтчет.Form.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Форма.ФормаДокумента")).toBe(false)
    expect(schema.description).toContain("Имя дочерней формы текущего объекта")
  })

  it("keeps member kind in schema when several current-owner member kinds are allowed", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Form", "Template"] })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("Форма.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Макет.ПечатнаяФорма")).toBe(true)
    expect(compiled.Check("ФормаДокумента")).toBe(false)
  })

  it("accepts current-owner members through tabular sections", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Attribute"] })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("ТабличнаяЧасть.Товары.Реквизит.Номенклатура")).toBe(true)
    expect(compiled.Check("Document.АвансовыйОтчет.TabularSection.Товары.Attribute.Номенклатура")).toBe(true)
  })

  it("keeps root constraints for current-owner compatible model member paths", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", roots: ["Document"], memberKinds: ["Form"] })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("Document.АвансовыйОтчет.Form.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Catalog.АвансовыйОтчет.Form.ФормаДокумента")).toBe(false)
  })

  it("describes hasType filters without narrowing the string pattern", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute"],
      filters: [{ kind: "hasType", type: "boolean" }],
    })

    expect(schema.description).toContain("тип которых содержит Булево")
  })

  it("describes styleItemType filters", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute"],
      filters: [{ kind: "styleItemType", values: ["Color", "Font"] }],
    })

    expect(schema.description).toContain("Цвет")
    expect(schema.description).toContain("Шрифт")
  })

  it("describes stringIndexedAttribute filters", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute"],
      filters: [{ kind: "stringIndexedAttribute" }],
    })

    expect(schema.description).toContain("пригодные для ввода по строке")
  })

  it("returns ordinary JSON Schema for style items", () => {
    const schema = buildMetadataTargetSchema({ kind: "styleItem", styleItemTypes: ["Font"] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^ЭлементСтиля\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
      examples: ["ЭлементСтиля.ИмяЭлементаСтиля"],
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })

  it("returns ordinary JSON Schema for common pictures", () => {
    const schema = buildMetadataTargetSchema({ kind: "commonPicture" })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^ОбщаяКартинка\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
      examples: ["ОбщаяКартинка.ИмяОбщейКартинки"],
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })
})

function expectMatches(schema: TSchema & { pattern?: string }, value: string): void {
  expect(new RegExp(String(schema.pattern)).test(value)).toBe(true)
}

function expectNotMatches(schema: TSchema & { pattern?: string }, value: string): void {
  expect(new RegExp(String(schema.pattern)).test(value)).toBe(false)
}
