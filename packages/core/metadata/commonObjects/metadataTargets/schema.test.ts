import { describe, expect, it } from "vitest"
import Schema from "typebox/schema"
import type { TSchema } from "typebox"
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

    expect(schema.examples).toEqual(["ИмяПеречисления"])
    expectMatches(schema, "ИмяПеречисления")
    expectNotMatches(schema, "Перечисление.ИмяПеречисления")
    expectNotMatches(schema, "Справочник.ИмяСправочника")
  })

  it("requires short object references when exactly one root is allowed", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["Language"] })

    expectMatches(schema, "Русский")
    expectNotMatches(schema, "Язык.Русский")
    expectNotMatches(schema, "Language.Русский")
  })

  it("accepts top-level roots used by subsystem content", () => {
    const schema = buildMetadataTargetSchema({ kind: "object" })

    expectMatches(schema, "ПодпискаНаСобытие.ОтветственныеЛицаДокументаОбработкаЗаполнения")
    expectMatches(schema, "ПакетXDTO.egais_ActCancelOnlineOrder")
    expectMatches(schema, "ПараметрФункциональныхОпций.ИспользоватьНоменклатуруПоставщика")
    expectMatches(schema, "WSСсылка.Калькулятор")
    expectMatches(schema, "Последовательность.ПартииТоваров")
  })

  it("accepts object path segments in nested object schemas", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["ExternalDataSource"], allowNested: true })

    expectMatches(schema, "ВнешнийИсточникДанных.Источник.Функция.Функция1")
    expectMatches(schema, "ВнешнийИсточникДанных.Источник.Таблица.Таблица1")
    expectNotMatches(schema, "Справочник.Товары.Функция.Функция1")
  })

  it("accepts exact object paths in object schemas", () => {
    const schema = buildMetadataTargetSchema({
      kind: "object",
      allowedObjectPaths: [
        ["ExternalDataSource", "Table"],
        ["ExternalDataSource", "Cube"],
      ],
    })

    expectMatches(schema, "ВнешнийИсточникДанных.Источник.Таблица.Таблица1")
    expectMatches(schema, "ВнешнийИсточникДанных.Источник.Куб.Куб1")
    expectMatches(schema, "ExternalDataSource.Source.Table.Table1")
    expectNotMatches(schema, "ВнешнийИсточникДанных.Источник.Куб.Куб1.ТаблицаИзмерения.Таблица1")
    expectNotMatches(schema, "Справочник.Товары")
  })

  it("describes full field paths with service segments", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "explicit", roots: ["Catalog"] })

    expect(schema).toMatchObject({
      type: "string",
      examples: ["Справочник.ИмяСправочника.Реквизит.ИмяРеквизита"],
    })
    expect(String(schema.description)).toContain("Полный путь члена объекта")
  })

  it("does not accept field paths when roots are empty", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "explicit", roots: [] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^(?!)$",
      examples: [],
    })
    expectNotMatches(schema, ".ИмяОбъекта.Реквизит.ИмяРеквизита")
    expectNotMatches(schema, "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")
  })

  it("restricts field-like member service segments by memberKinds", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "explicit",
      roots: ["Catalog"],
      memberKinds: ["Attribute", "StandardAttribute"],
    })

    expect(schema.examples).toEqual(["Справочник.ИмяСправочника.Реквизит.ИмяРеквизита"])
    expectMatches(schema, "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")
    expectMatches(schema, "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти.Реквизит.ИмяРеквизита")
    expectNotMatches(schema, "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти")
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
      examples: ["Справочник.ИмяСправочника.ИмяПредопределенногоЗначения", "Справочник.ИмяСправочника.ПустаяСсылка"],
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
      examples: ["ИмяРеквизита", "ИмяТаблицы.ИмяКолонки"],
    })
    expectMatches(schema, "ИмяРеквизита")
    expectMatches(schema, "ИмяТаблицы.ИмяКолонки")
    expectMatches(schema, "~Список.DefaultPicture")
    expectMatches(schema, "~Список.Period~Список.Период")
    expectMatches(schema, "Список[0].Поле")
    expectMatches(schema, "Объект.Товары[0].Номенклатура")
    expectMatches(schema, "~Список[0].DefaultPicture")
    expectMatches(schema, "~Список[0].Period~Список.Период")
    expectNotMatches(schema, "Список[].Поле")
    expectNotMatches(schema, "Список[abc].Поле")
    expectNotMatches(schema, "Список[0]..Поле")
    expect(String(schema.description)).toContain("string")
  })

  it("accepts opaque multiple-value form data paths only when explicitly allowed", () => {
    const strictSchema = buildMetadataTargetSchema({ kind: "dataPath", context: "form" })
    const opaqueSchema = buildMetadataTargetSchema({
      kind: "dataPath",
      context: "form",
      allowOpaqueMultipleValue: true,
    })
    const opaquePath = "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"

    expectNotMatches(strictSchema, opaquePath)
    expectMatches(opaqueSchema, opaquePath)
  })

  it("builds local member schema for single current-owner member kind", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Form"] })
    const compiled = Schema.Compile(schema)

    expect(compiled.Check("ФормаДокумента")).toBe(true)
    expect(compiled.Check("Document.АвансовыйОтчет.Form.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Форма.ФормаДокумента")).toBe(false)
    expect(schema.description).toContain("Имя дочерней формы текущего объекта")
  })

  it("keeps member kind in schema when several current-owner member kinds are allowed", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Form", "Template"] })
    const compiled = Schema.Compile(schema)

    expect(compiled.Check("Форма.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Макет.ПечатнаяФорма")).toBe(true)
    expect(compiled.Check("ФормаДокумента")).toBe(false)
  })

  it("accepts current-owner members through tabular sections", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Attribute"] })
    const compiled = Schema.Compile(schema)

    expect(compiled.Check("ТабличнаяЧасть.Товары.Реквизит.Номенклатура")).toBe(true)
    expect(compiled.Check("Document.АвансовыйОтчет.TabularSection.Товары.Attribute.Номенклатура")).toBe(true)
  })

  it("keeps root constraints for current-owner compatible model member paths", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "this",
      roots: ["Document"],
      memberKinds: ["Form"],
    })
    const compiled = Schema.Compile(schema)

    expect(compiled.Check("Document.АвансовыйОтчет.Form.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Catalog.АвансовыйОтчет.Form.ФормаДокумента")).toBe(false)
  })

  it("keeps root constraints for explicit-owner compatible model member paths", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "explicit",
      roots: ["Document"],
      memberKinds: ["Attribute"],
    })
    const compiled = Schema.Compile(schema)

    expect(compiled.Check("Document.АвансовыйОтчет.Attribute.Организация")).toBe(true)
    expect(compiled.Check("Catalog.АвансовыйОтчет.Attribute.Организация")).toBe(false)
  })

  it("keeps explicit-owner member examples inside allowed roots", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "explicit",
      roots: ["Catalog"],
      memberKinds: ["Attribute"],
    })

    expect(schema.examples).toEqual(["Справочник.ИмяСправочника.Реквизит.ИмяРеквизита"])
    expectMatches(schema, "Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")
    expectNotMatches(schema, "Документ.АвансовыйОтчет.Реквизит.Организация")
  })

  it("accepts allowed object paths in explicit-owner member schemas", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "explicit",
      allowedObjectPaths: [
        ["ExternalDataSource", "Table"],
        ["ExternalDataSource", "Cube", "DimensionTable"],
      ],
      allowedMemberPaths: [["Catalog", "Attribute"]],
    })

    expectMatches(schema, "ВнешнийИсточникДанных.Источник.Таблица.Таблица1")
    expectMatches(schema, "ВнешнийИсточникДанных.Источник.Куб.Куб1.ТаблицаИзмерения.Таблица1")
    expectMatches(schema, "ExternalDataSource.Source.Table.Table1")
    expectMatches(schema, "Справочник.Товары.Реквизит.Артикул")
    expectNotMatches(schema, "ВнешнийИсточникДанных.Источник.Куб.Куб1")
    expectNotMatches(schema, "Документ.Заказ")
    expectNotMatches(schema, "Документ.Заказ.Реквизит.Номер")
  })

  it("describes hasType filters without narrowing the string pattern", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute"],
      filters: [{ kind: "directMember" }, { kind: "hasType", type: "boolean" }],
    })

    expect(schema.description).toContain("прямые члены текущего объекта")
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

  it("returns ordinary JSON Schema for style items through object targets", () => {
    const schema = buildMetadataTargetSchema({
      kind: "object",
      roots: ["StyleItem"],
      filters: [{ kind: "styleItemType", values: ["Font"] }],
    })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^((ЭлементСтиля)\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*)$",
      examples: ["ЭлементСтиля.ИмяЭлементаСтиля"],
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })

  it("returns ordinary JSON Schema for common pictures through object targets", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["CommonPicture"] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^([a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*)$",
      examples: ["ИмяОбщейКартинки"],
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
