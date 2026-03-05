import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataValueFromYAML } from "./fromYAML"
import { MetadataFixedArrayValueYAML, MetadataFormChoiceListValueYAML, MetadataValueYAML } from "./types"

describe("importMetadataValueFromYAML", () => {
  it("should import string value from YAML", () => {
    const data: MetadataValueYAML = '"Текстовое значение"'

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "string",
      value: "Текстовое значение",
    })
  })

  it("should import boolean value from YAML", () => {
    const data: MetadataValueYAML = "Истина"

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "boolean",
      value: true,
    })
  })

  it("should import decimal value from YAML", () => {
    const data: MetadataValueYAML = "0"

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "decimal",
      value: 0,
    })
  })

  it("should import dateTime value from YAML", () => {
    const data: MetadataValueYAML = "24.12.2025 12:00:00"

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "dateTime",
      value: "2025-12-24T12:00:00",
    })
  })

  it("should import enum (ref) value from YAML", () => {
    const data: MetadataValueYAML = "Перечисление.ВидыДоговоров.СПоставщиком"

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "ref",
      value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
    })
  })

  it("should import catalog (ref) value from YAML", () => {
    const data: MetadataValueYAML = "Справочник.Пользователи.ПустаяСсылка"

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "ref",
      value: "Catalog.Пользователи.EmptyRef",
    })
  })

  it("should import fixedArray value from YAML", () => {
    const data: MetadataFixedArrayValueYAML = [
      "Перечисление.ТипыСчетов.КосвенныеЗатраты",
      "Перечисление.ТипыСчетов.Расходы",
    ]

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты",
        },
        {
          type: "ref",
          value: "Enum.ТипыСчетов.EnumValue.Расходы",
        },
      ],
    })
  })

  it("should import FormChoiceListDesTimeValue from YAML", () => {
    const data: MetadataValueYAML = '"ФЛ"(Физическое лицо)'

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "formChoiceListDesTimeValue",
      presentation: {
        items: {
          ru: "Физическое лицо",
        },
      },
      value: {
        type: "string",
        value: "ФЛ",
      },
    })
  })

  it("should import multilanguage FormChoiceListDesTimeValue from YAML", () => {
    const data: MetadataFormChoiceListValueYAML = {
      Представление: {
        ru: "Физическое лицо",
        en: "Physical person",
      },
      Значение: '"ФЛ"',
    }

    const result = importMetadataValueFromYAML(mockContext, mockRule, data)

    expect(result).toEqual({
      type: "formChoiceListDesTimeValue",
      presentation: {
        items: {
          ru: "Физическое лицо",
          en: "Physical person",
        },
      },
      value: {
        type: "string",
        value: "ФЛ",
      },
    })
  })

  it("should return undefined for undefined input", () => {
    const result = importMetadataValueFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
