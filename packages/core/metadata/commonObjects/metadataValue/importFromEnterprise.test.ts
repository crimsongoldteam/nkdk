import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataValueFromEnterprise } from "./importFromEnterprise"
import { MetadataValueEnterprise } from "./types"
import { MetadataFixedArrayValueEnterprise, MetadataFormChoiceListDesTimeValueEnterprise } from "./types.ts"

describe("importMetadataValueFromEnterprise", () => {
  it("should import string value from Enterprise", () => {
    const data: MetadataValueEnterprise = '"Текстовое значение"'

    const result = importMetadataValueFromEnterprise(mockСontext, data)

    expect(result).toEqual({
      type: "string",
      value: "Текстовое значение",
    })
  })

  it("should import boolean value from Enterprise", () => {
    const data: MetadataValueEnterprise = "Истина"

    const result = importMetadataValueFromEnterprise(mockСontext, data)

    expect(result).toEqual({
      type: "boolean",
      value: true,
    })
  })

  it("should import decimal value from Enterprise", () => {
    const data: MetadataValueEnterprise = "0"

    const result = importMetadataValueFromEnterprise(mockСontext, data)

    expect(result).toEqual({
      type: "decimal",
      value: 0,
    })
  })

  it("should import dateTime value from Enterprise", () => {
    const data: MetadataValueEnterprise = "24.12.2025 12:00:00"

    const result = importMetadataValueFromEnterprise(mockСontext, data)

    expect(result).toEqual({
      type: "dateTime",
      value: "2025-12-24T12:00:00",
    })
  })

  it("should import enum (ref) value from Enterprise", () => {
    const data: MetadataValueEnterprise = "Перечисление.ВидыДоговоров.СПоставщиком"

    const result = importMetadataValueFromEnterprise(mockСontext, data)

    expect(result).toEqual({
      type: "ref",
      value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
    })
  })

  it("should import catalog (ref) value from Enterprise", () => {
    const data: MetadataValueEnterprise = "Справочник.Пользователи.ПустаяСсылка"

    const result = importMetadataValueFromEnterprise(mockСontext, data)

    expect(result).toEqual({
      type: "ref",
      value: "Catalog.Пользователи.EmptyRef",
    })
  })

  it("should import fixedArray value from Enterprise", () => {
    const data: MetadataFixedArrayValueEnterprise = [
      "Перечисление.ТипыСчетов.КосвенныеЗатраты",
      "Перечисление.ТипыСчетов.Расходы",
    ]

    const result = importMetadataValueFromEnterprise(mockСontext, data)

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

  it("should import FormChoiceListDesTimeValue from Enterprise", () => {
    const data: MetadataValueEnterprise = '"ФЛ"(Физическое лицо)'

    const result = importMetadataValueFromEnterprise(mockСontext, data)

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

  it("should import multilanguage FormChoiceListDesTimeValue from Enterprise", () => {
    const data: MetadataFormChoiceListDesTimeValueEnterprise = {
      Представление: {
        ru: "Физическое лицо",
        en: "Physical person",
      },
      Значение: '"ФЛ"',
    }

    const result = importMetadataValueFromEnterprise(mockСontext, data)

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
    const result = importMetadataValueFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
