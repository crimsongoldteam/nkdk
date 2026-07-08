import { describe, expect, it } from "vitest"
import { formatMetadataTargetToYAML, parseMetadataTargetFromModel, parseMetadataTargetFromYAML } from "./index"

describe("metadataTargets parser", () => {
  it("parses object references from Russian YAML to canonical model strings", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Контрагенты",
      constraint: { kind: "object", roots: ["Catalog"] },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Catalog.Контрагенты",
      target: { kind: "object", root: "Catalog", objectName: "Контрагенты" },
    })
  })

  it("parses short object references when exactly one root is allowed", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Русский",
        constraint: { kind: "object", roots: ["Language"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Language.Русский",
      target: { kind: "object", root: "Language", objectName: "Русский" },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Language.Русский",
        constraint: { kind: "object", roots: ["Language"] },
      })
    ).toBe("Русский")
  })

  it("rejects full object references when exactly one root is allowed", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Язык.Русский",
        constraint: { kind: "object", roots: ["Language"] },
      })
    ).toEqual({
      ok: false,
      code: "invalid-shape",
      message: "Ожидалось имя объекта без корня, потому что корень задан правилом",
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Language.Русский",
        constraint: { kind: "object", roots: ["Language"] },
      })
    ).toEqual({
      ok: false,
      code: "unknown-root",
      message: 'Неизвестный корень "Language"',
    })
  })

  it("keeps full object references when roots are ambiguous", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.Товары",
        constraint: { kind: "object", roots: ["Catalog", "Document"] },
      })
    ).toMatchObject({
      ok: true,
      canonical: "Catalog.Товары",
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Товары",
        constraint: { kind: "object", roots: ["Catalog", "Document"] },
      })
    ).toMatchObject({
      ok: false,
      code: "unknown-root",
    })
  })

  it("parses full field paths with required service segments", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      constraint: { kind: "member", owner: "explicit", roots: ["Catalog"] },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
      target: {
        kind: "member",
        root: "Catalog",
        objectName: "Номенклатура",
        segments: [
          { kind: "TabularSection", name: "Товары" },
          { kind: "Attribute", name: "Количество" },
        ],
      },
    })
  })

  it("parses and formats standard member YAML aliases from standardMembers", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "ПланОбмена.Синхронизация.СтандартныйРеквизит.ДатаОбмена",
        constraint: { kind: "member", owner: "explicit", roots: ["ExchangePlan"], memberKinds: ["StandardAttribute"] },
      })
    ).toMatchObject({
      ok: true,
      canonical: "ExchangePlan.Синхронизация.StandardAttribute.ExchangeDate",
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "ExchangePlan.Синхронизация.StandardAttribute.ExchangeDate",
        constraint: { kind: "member", owner: "explicit", roots: ["ExchangePlan"], memberKinds: ["StandardAttribute"] },
      })
    ).toBe("ПланОбмена.Синхронизация.СтандартныйРеквизит.ExchangeDate")
  })

  it("applies memberKinds to the terminal field-like member segment", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      constraint: {
        kind: "member",
        owner: "explicit",
        roots: ["Catalog"],
        memberKinds: ["Attribute", "StandardAttribute"],
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
          kind: "member",
          owner: "explicit",
          roots: ["Catalog"],
          memberKinds: ["Attribute", "StandardAttribute"],
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
        constraint: { kind: "member", owner: "explicit", roots: ["Catalog"] },
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
        constraint: { kind: "member", owner: "explicit", roots: ["AccumulationRegister"] },
      })
    ).toMatchObject({
      ok: true,
      canonical: "AccumulationRegister.Продажи.StandardAttribute.Period",
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "AccumulationRegister.Продажи.StandardAttribute.Period",
        constraint: { kind: "member", owner: "explicit", roots: ["AccumulationRegister"] },
      })
    ).toBe("РегистрНакопления.Продажи.СтандартныйРеквизит.Период")

    expect(
      formatMetadataTargetToYAML({
        canonical: "Catalog.Номенклатура.TabularSection.Товары.StandardAttribute.LineNumber",
        constraint: { kind: "member", owner: "explicit", roots: ["Catalog"] },
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
        constraint: { kind: "member", owner: "explicit", roots: ["Catalog"] },
      })
    ).toEqual({
      ok: true,
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
      target: {
        kind: "member",
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

  it("parses and formats style items through object targets with style filters", () => {
    const constraint = {
      kind: "object",
      roots: ["StyleItem"],
      filters: [{ kind: "styleItemType", values: ["Color"] }],
    } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "ЭлементСтиля.ОсновнойЦвет",
        constraint,
      })
    ).toMatchObject({
      ok: true,
      canonical: "StyleItem.ОсновнойЦвет",
      target: { kind: "object", root: "StyleItem", objectName: "ОсновнойЦвет" },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "StyleItem.ОсновнойЦвет",
        constraint,
      })
    ).toMatchObject({
      ok: true,
      canonical: "StyleItem.ОсновнойЦвет",
      target: { kind: "object", root: "StyleItem", objectName: "ОсновнойЦвет" },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "StyleItem.ОсновнойЦвет",
        constraint,
      })
    ).toBe("ЭлементСтиля.ОсновнойЦвет")
  })

  it("parses and formats common pictures through object targets", () => {
    const constraint = { kind: "object", roots: ["CommonPicture"] } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "Логотип",
        constraint,
      })
    ).toMatchObject({
      ok: true,
      canonical: "CommonPicture.Логотип",
      target: { kind: "object", root: "CommonPicture", objectName: "Логотип" },
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "CommonPicture.Логотип",
        constraint,
      })
    ).toMatchObject({
      ok: true,
      canonical: "CommonPicture.Логотип",
      target: { kind: "object", root: "CommonPicture", objectName: "Логотип" },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "CommonPicture.Логотип",
        constraint,
      })
    ).toBe("Логотип")
  })

  it("parses and formats additional top-level roots used by subsystem content", () => {
    const cases = [
      [
        "ПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойства",
        "EventSubscription.ПодпискаНаСобытиеВсеСвойства",
        "EventSubscription",
      ],
      ["ПакетXDTO.ПакетXDTOВсеСвойства", "XDTOPackage.ПакетXDTOВсеСвойства", "XDTOPackage"],
      ["WSСсылка.WSСсылкаВсеСвойства", "WSReference.WSСсылкаВсеСвойства", "WSReference"],
      [
        "ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства",
        "FunctionalOptionsParameter.ПараметрФункциональныхОпцийВсеСвойства",
        "FunctionalOptionsParameter",
      ],
    ] as const

    for (const [yaml, canonical, root] of cases) {
      const constraint = { kind: "object", allowedObjectPaths: [[root]] } as const
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("parses and formats external data source object paths", () => {
    const constraint = {
      kind: "object",
      allowedObjectPaths: [
        ["ExternalDataSource", "Table"],
        ["ExternalDataSource", "Cube"],
        ["ExternalDataSource", "Cube", "DimensionTable"],
        ["ExternalDataSource", "Function"],
      ],
    } as const

    const cases = [
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.ТаблицаИзмерения.ТаблицаИзмеренияВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.DimensionTable.ТаблицаИзмеренияВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Функция.ФункцияВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Function.ФункцияВсеСвойства",
      ],
    ] as const

    for (const [yaml, canonical] of cases) {
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(parseMetadataTargetFromModel({ canonical, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("parses and formats exact external data source member paths", () => {
    const constraint = {
      kind: "member",
      owner: "explicit",
      allowedObjectPaths: [
        ["ExternalDataSource", "Table"],
        ["ExternalDataSource", "Cube", "DimensionTable"],
      ],
      allowedMemberPaths: [
        ["ExternalDataSource", "Table", "Field"],
        ["ExternalDataSource", "Table", "Command"],
        ["ExternalDataSource", "Cube", "DimensionTable", "Field"],
        ["ExternalDataSource", "Cube", "Dimension"],
        ["ExternalDataSource", "Cube", "Resource"],
        ["ExternalDataSource", "Cube", "Command"],
      ],
    } as const

    const cases = [
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства.Поле.ПолеВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства.Field.ПолеВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства.Команда.Команда1",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства.Command.Команда1",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.ТаблицаИзмерения.ТаблицаИзмеренияВсеСвойства.Поле.ПолеВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.DimensionTable.ТаблицаИзмеренияВсеСвойства.Field.ПолеВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.Измерение.ИзмерениеВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Dimension.ИзмерениеВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.Ресурс.РесурсВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Resource.РесурсВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.Команда.Команда1",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Command.Команда1",
      ],
    ] as const

    for (const [yaml, canonical] of cases) {
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(parseMetadataTargetFromModel({ canonical, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("rejects exact target paths outside the configured allow list", () => {
    expect(
      parseMetadataTargetFromModel({
        canonical: "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
        constraint: { kind: "object", allowedObjectPaths: [["ExternalDataSource", "Table"]] },
      })
    ).toMatchObject({ ok: false, code: "disallowed-kind" })

    expect(
      parseMetadataTargetFromModel({
        canonical: "AccumulationRegister.РегистрНакопленияВсеСвойстваОбороты",
        constraint: {
          kind: "member",
          owner: "explicit",
          allowedMemberPaths: [["AccumulationRegister", "Dimension"]],
        },
      })
    ).toMatchObject({ ok: false, code: "invalid-shape" })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом",
        constraint: { kind: "object", allowedObjectPaths: [["Catalog"]] },
      })
    ).toMatchObject({ ok: false, code: "unknown-segment" })
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
        constraint: { kind: "member", owner: "explicit", roots: ["Catalog"] },
      })
    ).toMatchObject({ ok: false, code: "invalid-shape" })
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

  it("accepts explicit object roots in current-owner member constraints", () => {
    const owner = { root: "Report", objectName: "Продажи" } as const
    const constraint = {
      kind: "member",
      owner: "this",
      memberKinds: ["Form"],
      objectRoots: ["CommonForm"],
    } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "ОбщаяФорма.ФормаОтчета",
        owner,
        constraint,
      })
    ).toEqual({
      ok: true,
      canonical: "CommonForm.ФормаОтчета",
      target: { kind: "object", root: "CommonForm", objectName: "ФормаОтчета" },
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "CommonForm.ФормаОтчета",
        owner,
        constraint,
      })
    ).toMatchObject({ ok: true, canonical: "CommonForm.ФормаОтчета" })

    expect(
      formatMetadataTargetToYAML({
        canonical: "CommonForm.ФормаОтчета",
        owner,
        constraint,
      })
    ).toBe("ОбщаяФорма.ФормаОтчета")
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
