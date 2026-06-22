import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { importDcsMetadataValueFromYAML } from "./fromYAML"
import { dcsMetadataValueYAMLFixtures } from "./__fixtures__/data"

describe("import MetadataDcsMetadataValue from YAML", () => {
  it.each(dcsMetadataValueYAMLFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromYAML({
        rule: fixture.rule,
        value: fixture.yaml,
      })
    ).toEqual(fixture.value)
  })

  it("imports explicit DesignTimeValue field", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          Тип: "Поле",
          Значение: "СписокФайлов.ФормаРСВ_Представление",
        },
      })
    ).toEqual({
      type: "Field",
      value: "СписокФайлов.ФормаРСВ_Представление",
    })
  })

  it("imports explicit DesignTimeValue LocalStringType", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          Тип: "МногоязычнаяСтрока",
          Значение: "ЧЦ=3; ЧДЦ=2",
        },
      })
    ).toEqual({
      items: { ru: "ЧЦ=3; ЧДЦ=2" },
    })
  })

  it("imports explicit DesignTimeValue LocalFormattedStringType", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          Тип: "МногоязычнаяФорматированнаяСтрока",
          Значение: {
            Форматированный: "Истина",
            Текст: "Многоязычная форматированная строка",
          },
        },
      })
    ).toEqual({
      type: "LocalFormattedStringType",
      value: {
        formatted: true,
        items: { ru: "Многоязычная форматированная строка" },
      },
    })
  })

  it("imports DesignTimeValue without explicit type as xs:string", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: "Все полномочия",
      })
    ).toEqual({
      type: "string",
      value: "Все полномочия",
    })
  })

  it("imports beginning date string as Field value dateTime", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
        value: "01.01.0001 00:00:00",
      })
    ).toEqual({ type: "dateTime", value: "0001-01-01T00:00:00" })
  })

  it("keeps local DCS field paths as strings", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
        value: "Реквизит1",
      })
    ).toEqual("Реквизит1")
  })

  it("preserves source empty LocalStringType when YAML value is undefined", () => {
    const sourceValue = { items: {} }

    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: undefined,
        sourceValue
      })
    ).toEqual(sourceValue)
  })

  it("uses explicit YAML field over source empty LocalStringType", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          Тип: "Поле",
          Значение: "СписокФайлов.ФормаРСВ_Представление",
        },
        sourceValue: { items: {} },
      })
    ).toEqual({
      type: "Field",
      value: "СписокФайлов.ФормаРСВ_Представление",
    })
  })

  it("does not preserve non-empty-shape source LocalStringType", () => {
    const sourceValue = { items: {}, extra: true }

    expect(
      importDcsMetadataValueFromYAML(
        mockContext,
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        undefined,
        sourceValue
      )
    ).toBeUndefined()

    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: undefined,
        sourceValue,
      })
    ).toBeUndefined()
  })

  it("does not preserve source explicit field when YAML value is undefined", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: undefined,
        sourceValue: { type: "Field", value: "X" },
      })
    ).toBeUndefined()
  })

  it("imports Russian metadata path as enterprise DesignTimeValue for primitive DCS values", () => {
    expect(
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
        value: "ПланСчетов.Хозрасчетный.ПФР_ОПС_ИП",
      })
    ).toEqual({
      type: "DesignTimeValue",
      value: "ПланСчетов.Хозрасчетный.ПФР_ОПС_ИП",
    })
  })

  it("rejects invalid explicit text value", () => {
    expect(() =>
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          Тип: "Поле",
          Значение: 123,
        },
      })
    ).toThrow("MetadataDcsMetadataValue YAML: invalid explicit text value")
  })
})
