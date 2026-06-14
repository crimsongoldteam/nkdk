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
})
