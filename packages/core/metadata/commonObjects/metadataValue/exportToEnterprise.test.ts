import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { exportMetadataValueToEnterprise } from "./exportToEnterprise"
import { MetadataValue } from "./types"

describe("exportMetadataValueToEnterprise", () => {
  it("should export string value to Enterprise", () => {
    const data: MetadataValue = {
      type: "string",
      value: "Текстовое значение",
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual({
      Тип: "Строка",
      Значение: "Текстовое значение",
    })
  })

  it("should export boolean value to Enterprise", () => {
    const data: MetadataValue = {
      type: "boolean",
      value: true,
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual({
      Тип: "Булево ",
      Значение: "Истина",
    })
  })

  it("should export decimal value to Enterprise", () => {
    const data: MetadataValue = {
      type: "decimal",
      value: 0,
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual({
      Тип: "Число",
      Значение: "0",
    })
  })

  it("should export dateTime value to Enterprise", () => {
    const data: MetadataValue = {
      type: "dateTime",
      value: "2025-12-24T12:00:00",
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual({
      Тип: "Дата",
      Значение: "24.12.2025 12:00:00",
    })
  })

  it("should export enum (ref) value to Enterprise", () => {
    const data: MetadataValue = {
      type: "ref",
      value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual("Перечисление.ВидыДоговоров.СПоставщиком")
  })

  it("should export catalog (ref) value to Enterprise", () => {
    const data: MetadataValue = {
      type: "ref",
      value: "Catalog.Пользователи.EmptyRef",
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual("Справочник.Пользователи.ПустаяСсылка")
  })

  it("should export fixedArray value to Enterprise", () => {
    const data: MetadataValue = {
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
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual(["Перечисление.ТипыСчетов.КосвенныеЗатраты", "Перечисление.ТипыСчетов.Расходы"])
  })

  it("should export FormChoiceListDesTimeValue to Enterprise", () => {
    const data: MetadataValue = {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо" } },
      value: {
        type: "string",
        value: "ФЛ",
      },
    }

    const result = exportMetadataValueToEnterprise(mockСontext, data)

    expect(result).toEqual({
      Представление: "Физическое лицо",
      Тип: "Строка",
      Значение: "ФЛ",
    })
  })

  //   it("should export ApplicationUsePurpose type to Enterprise", () => {
  //     const data: MetadataValue = {
  //       type: "ApplicationUsePurpose",
  //       value: "PlatformApplication",
  //     }

  //     const result = exportMetadataValueToEnterprise(mockСontext, data)

  //     expect(result).toEqual({
  //       Тип: "ApplicationUsePurpose",
  //       Значение: "PlatformApplication",
  //     })
  //   })

  it("should return undefined for undefined input", () => {
    const result = exportMetadataValueToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
