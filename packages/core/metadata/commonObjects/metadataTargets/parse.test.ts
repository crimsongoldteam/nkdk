import { describe, expect, it } from "vitest"
import {
  formatMetadataTargetToYAML,
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "./index"

describe("metadataTargets parser", () => {
  it("parses object references from Russian YAML to canonical model strings", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Контрагенты",
      constraint: { kind: "object", roots: ["Catalog"] },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Catalog.Контрагенты",
      target: { kind: "object", root: "Catalog", objectName: "Контрагенты" },
    })
  })

  it("parses full field paths with required service segments", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
      target: {
        kind: "field",
        root: "Catalog",
        objectName: "Номенклатура",
        segments: [
          { kind: "TabularSection", name: "Товары" },
          { kind: "Attribute", name: "Количество" },
        ],
      },
    })
  })

  it("applies fieldKinds to the terminal field segment", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      constraint: {
        kind: "field",
        owner: "explicit",
        roots: ["Catalog"],
        fieldKinds: ["Attribute", "StandardAttribute"],
      },
    })

    expect(result).toMatchObject({
      ok: true,
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.Номенклатура.ТабличнаяЧасть.Товары",
        constraint: {
          kind: "field",
          owner: "explicit",
          roots: ["Catalog"],
          fieldKinds: ["Attribute", "StandardAttribute"],
        },
      })
    ).toMatchObject({ ok: false, code: "disallowed-kind" })
  })

  it("parses predefined values and EmptyRef values", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.СтавкиНДС.БезНДС",
        constraint: {
          kind: "value",
          roots: ["Catalog"],
          valueKinds: ["predefinedValue", "emptyRef"],
          allowEmptyRef: true,
        },
      })
    ).toMatchObject({
      ok: true,
      canonical: "Catalog.СтавкиНДС.БезНДС",
      target: {
        kind: "value",
        root: "Catalog",
        objectName: "СтавкиНДС",
        valueKind: "predefinedValue",
        valueName: "БезНДС",
      },
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.СтавкиНДС.ПустаяСсылка",
        constraint: {
          kind: "value",
          roots: ["Catalog"],
          valueKinds: ["predefinedValue", "emptyRef"],
          allowEmptyRef: true,
        },
      })
    ).toMatchObject({
      ok: true,
      canonical: "Catalog.СтавкиНДС.EmptyRef",
      target: { kind: "value", root: "Catalog", objectName: "СтавкиНДС", valueKind: "emptyRef" },
    })
  })

  it("parses enum values with EnumValue in the model only", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Перечисление.ВидыДоговоров.СПоставщиком",
      constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue", "emptyRef"], allowEmptyRef: true },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
      target: {
        kind: "value",
        root: "Enum",
        objectName: "ВидыДоговоров",
        valueKind: "enumValue",
        valueName: "СПоставщиком",
      },
    })
  })

  it("formats canonical model strings back to Russian YAML", () => {
    expect(
      formatMetadataTargetToYAML({
        canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
        constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
      })
    ).toBe("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество")

    expect(
      formatMetadataTargetToYAML({
        canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
        constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue"] },
      })
    ).toBe("Перечисление.ВидыДоговоров.СПоставщиком")
  })

  it("parses and formats standard attribute aliases", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "РегистрНакопления.Продажи.СтандартныйРеквизит.Период",
        constraint: { kind: "field", owner: "explicit", roots: ["AccumulationRegister"] },
      })
    ).toMatchObject({
      ok: true,
      canonical: "AccumulationRegister.Продажи.StandardAttribute.Period",
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "AccumulationRegister.Продажи.StandardAttribute.Period",
        constraint: { kind: "field", owner: "explicit", roots: ["AccumulationRegister"] },
      })
    ).toBe("РегистрНакопления.Продажи.СтандартныйРеквизит.Период")

    expect(
      formatMetadataTargetToYAML({
        canonical: "Catalog.Номенклатура.TabularSection.Товары.StandardAttribute.LineNumber",
        constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
      })
    ).toBe("Справочник.Номенклатура.ТабличнаяЧасть.Товары.СтандартныйРеквизит.НомерСтроки")
  })

  it("parses canonical model strings", () => {
    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.Контрагенты",
        constraint: { kind: "object", roots: ["Catalog"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Catalog.Контрагенты",
      target: { kind: "object", root: "Catalog", objectName: "Контрагенты" },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
        constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
      target: {
        kind: "field",
        root: "Catalog",
        objectName: "Номенклатура",
        segments: [
          { kind: "TabularSection", name: "Товары" },
          { kind: "Attribute", name: "Количество" },
        ],
      },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.СтавкиНДС.БезНДС",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["predefinedValue"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Catalog.СтавкиНДС.БезНДС",
      target: {
        kind: "value",
        root: "Catalog",
        objectName: "СтавкиНДС",
        valueKind: "predefinedValue",
        valueName: "БезНДС",
      },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
        constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
      target: {
        kind: "value",
        root: "Enum",
        objectName: "ВидыДоговоров",
        valueKind: "enumValue",
        valueName: "СПоставщиком",
      },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.СтавкиНДС.EmptyRef",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["emptyRef"], allowEmptyRef: true },
      })
    ).toEqual({
      ok: true,
      canonical: "Catalog.СтавкиНДС.EmptyRef",
      target: { kind: "value", root: "Catalog", objectName: "СтавкиНДС", valueKind: "emptyRef" },
    })
  })

  it("formats EmptyRef model strings back to Russian YAML", () => {
    expect(
      formatMetadataTargetToYAML({
        canonical: "Catalog.СтавкиНДС.EmptyRef",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["emptyRef"], allowEmptyRef: true },
      })
    ).toBe("Справочник.СтавкиНДС.ПустаяСсылка")
  })

  it("parses and formats style items", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "ЭлементСтиля.ОсновнойЦвет",
        constraint: { kind: "styleItem", styleItemTypes: ["Color"] },
      })
    ).toEqual({
      ok: true,
      canonical: "StyleItem.ОсновнойЦвет",
      target: { kind: "styleItem", name: "ОсновнойЦвет" },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "StyleItem.ОсновнойЦвет",
        constraint: { kind: "styleItem", styleItemTypes: ["Color"] },
      })
    ).toEqual({
      ok: true,
      canonical: "StyleItem.ОсновнойЦвет",
      target: { kind: "styleItem", name: "ОсновнойЦвет" },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "StyleItem.ОсновнойЦвет",
        constraint: { kind: "styleItem", styleItemTypes: ["Color"] },
      })
    ).toBe("ЭлементСтиля.ОсновнойЦвет")
  })

  it("parses and formats common pictures", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "ОбщаяКартинка.Логотип",
        constraint: { kind: "commonPicture" },
      })
    ).toEqual({
      ok: true,
      canonical: "CommonPicture.Логотип",
      target: { kind: "commonPicture", name: "Логотип" },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "CommonPicture.Логотип",
        constraint: { kind: "commonPicture" },
      })
    ).toEqual({
      ok: true,
      canonical: "CommonPicture.Логотип",
      target: { kind: "commonPicture", name: "Логотип" },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "CommonPicture.Логотип",
        constraint: { kind: "commonPicture" },
      })
    ).toBe("ОбщаяКартинка.Логотип")
  })

  it("rejects English roots in YAML as unknown roots", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Catalog.Контрагенты",
        constraint: { kind: "object", roots: ["Catalog"] },
      })
    ).toEqual({
      ok: false,
      code: "unknown-root",
      message: 'Неизвестный корень "Catalog"',
    })
  })

  it("rejects old PredefinedData and short field forms without compatibility conversion", () => {
    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.СтавкиНДС.PredefinedData.БезНДС",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["predefinedValue"] },
      })
    ).toMatchObject({ ok: false, code: "unknown-segment" })

    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.Номенклатура.Количество",
        constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
      })
    ).toMatchObject({ ok: false, code: "unknown-segment" })
  })

  it("reports extra value path segments instead of valid earlier value segments", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.СтавкиНДС.БезНДС.Лишнее",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["predefinedValue"] },
      })
    ).toEqual({
      ok: false,
      code: "unknown-segment",
      message: 'Неизвестный сегмент "Лишнее"',
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком.Extra",
        constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue"] },
      })
    ).toEqual({
      ok: false,
      code: "unknown-segment",
      message: 'Неизвестный сегмент "Extra"',
    })
  })

  it("parses local member names for the current owner", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "ФормаДокумента",
        owner,
        constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
      target: {
        kind: "member",
        root: "Document",
        objectName: "АвансовыйОтчет",
        segments: [{ kind: "Form", name: "ФормаДокумента" }],
      },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner,
        constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
      })
    ).toBe("ФормаДокумента")
  })

  it("applies root constraints to local member targets", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "ФормаДокумента",
        owner,
        constraint: { kind: "member", owner: "this", roots: ["Catalog"], memberKinds: ["Form"] },
      })
    ).toMatchObject({ ok: false, code: "disallowed-root" })
  })

  it("normalizes standard attribute aliases in local member targets", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const
    const constraint = { kind: "member", owner: "this", memberKinds: ["StandardAttribute"] } as const

    expect(parseMetadataTargetFromYAML({ value: "Дата", owner, constraint })).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.StandardAttribute.Date",
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.StandardAttribute.Date",
        owner,
        constraint,
      })
    ).toBe("Дата")
  })

  it("parses local member paths through tabular sections for the current owner", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "ТабличнаяЧасть.Товары.Реквизит.Количество",
        owner,
        constraint: { kind: "member", owner: "this", memberKinds: ["Attribute"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Document.АвансовыйОтчет.TabularSection.Товары.Attribute.Количество",
      target: {
        kind: "member",
        root: "Document",
        objectName: "АвансовыйОтчет",
        segments: [
          { kind: "TabularSection", name: "Товары" },
          { kind: "Attribute", name: "Количество" },
        ],
      },
    })
  })

  it("rejects local member kind segments when only one member kind is allowed", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const

    const result = parseMetadataTargetFromYAML({
      value: "Форма.ФормаДокумента",
      owner,
      constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
    })

    expect(result).toMatchObject({ ok: false, code: "invalid-shape" })
  })

  it("keeps member kind in YAML when several local member kinds are allowed", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const
    const constraint = { kind: "member", owner: "this", memberKinds: ["Form", "Template"] } as const

    expect(parseMetadataTargetFromYAML({ value: "Форма.ФормаДокумента", owner, constraint })).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })
    expect(parseMetadataTargetFromYAML({ value: "Макет.ПечатнаяФорма", owner, constraint })).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Template.ПечатнаяФорма",
    })
    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.Template.ПечатнаяФорма",
        owner,
        constraint,
      })
    ).toBe("Макет.ПечатнаяФорма")
  })

  it("parses explicit owner member paths", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Документ.АвансовыйОтчет.Реквизит.Организация",
        constraint: { kind: "member", owner: "explicit", roots: ["Document"], memberKinds: ["Attribute"] },
      })
    ).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Attribute.Организация",
      target: {
        kind: "member",
        root: "Document",
        objectName: "АвансовыйОтчет",
        segments: [{ kind: "Attribute", name: "Организация" }],
      },
    })
  })

  it("accepts canonical model member paths for explicit owner constraints in YAML", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Document.АвансовыйОтчет.Attribute.Организация",
        constraint: { kind: "member", owner: "explicit", roots: ["Document"], memberKinds: ["Attribute"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Attribute.Организация",
      target: {
        kind: "member",
        root: "Document",
        objectName: "АвансовыйОтчет",
        segments: [{ kind: "Attribute", name: "Организация" }],
      },
    })
  })

  it("accepts old canonical full member paths on import and normalizes them on export", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const
    const constraint = { kind: "member", owner: "this", memberKinds: ["Form"] } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner,
        constraint,
      })
    ).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner,
        constraint,
      })
    ).toBe("ФормаДокумента")
  })

  it("requires owner context for local member targets", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "ФормаДокумента",
        constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
      })
    ).toEqual({
      ok: false,
      code: "invalid-shape",
      message: 'Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта',
    })
  })
})
