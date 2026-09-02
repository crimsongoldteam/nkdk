import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "./__fixtures__/data"
import { mockContext } from "../../../tests/mockContext"
import { explicitYAMLString } from "@nkdk/runtime"
import { importMetadataValueFromYAML } from "./fromYAML"
import { MetadataFormChoiceListValueYAML, MetadataValueYAML } from "./types"

describe("importMetadataValueFromYAML", () => {
  it.each(metadataValueFixtures)("should import $name value from YAML", (fixture) => {
    const result = importMetadataValueFromYAML(
      mockContext,
      fixture.rule as any,
      fixture.YAML as MetadataValueYAML | MetadataFormChoiceListValueYAML
    )

    expect(result).toEqual(fixture.YAML === undefined ? undefined : fixture.internal)
  })

  it("imports DataCompositionComparisonType from YAML", () => {
    const result = importMetadataValueFromYAML(
      mockContext,
      { type: "MetadataValue", valueType: ["DataCompositionComparisonType"] } as any,
      "Равно"
    )

    expect(result).toEqual({ type: "DataCompositionComparisonType", value: "Equal" })
  })

  it("imports AccountType from explicit YAML", () => {
    const result = importMetadataValueFromYAML(
      mockContext,
      { type: "MetadataValue" } as any,
      {
        Тип: "ВидСчета",
        Значение: "АктивноПассивный",
      } as any
    )

    expect(result).toEqual({ type: "AccountType", value: "ActivePassive" })
  })

  it("imports compact form choice list object unless it is an explicit typed value", () => {
    const result = importMetadataValueFromYAML(mockContext, { type: "MetadataValue" } as any, {
      Значение: "Истина",
    })

    expect(result).toEqual({
      type: "formChoiceListDesTimeValue",
      value: { type: "boolean", value: true },
    })
  })

  it("imports metadata target value references from YAML", () => {
    expect(
      importMetadataValueFromYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        "Справочник.СтавкиНДС.ПустаяСсылка"
      )
    ).toEqual({
      type: "ref",
      value: "Catalog.СтавкиНДС.EmptyRef",
    })

    expect(
      importMetadataValueFromYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        "Перечисление.ВидыДоговоров.СПоставщиком"
      )
    ).toEqual({
      type: "ref",
      value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
    })
  })

  it("imports metadata object references from YAML as ref values", () => {
    expect(
      importMetadataValueFromYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        "Документ.ПоступлениеБезналичныхДенежныхСредств"
      )
    ).toEqual({
      type: "ref",
      value: "Document.ПоступлениеБезналичныхДенежныхСредств",
    })
  })

  it("rejects legacy model-root value references in YAML", () => {
    expect(() =>
      importMetadataValueFromYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        "Catalog.СтавкиНДС.PredefinedData.БезНДС"
      )
    ).toThrow('Неизвестный корень "Catalog"')
  })

  it("сохраняет составной UUID DesignTimeRef дословно", () => {
    const uuidReference = "447E2BD8-FA43-442E-91DB-B17634E036D9.C26F06AB-FB3E-46A7-A391-FDCCD77B4231"
    expect(
      importMetadataValueFromYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        uuidReference
      )
    ).toEqual({
      type: "ref",
      value: uuidReference,
    })
  })

  it("imports explicit YAML string marker as string MetadataValue without valueType", () => {
    const result = importMetadataValueFromYAML(
      mockContext,
      { type: "MetadataValue" } as any,
      explicitYAMLString("456") as any
    )

    expect(result).toEqual({ type: "string", value: "456" })
  })

  describe("строгая валидация valueType", () => {
    it("должен бросить при valueType: [string] и фактическом boolean (Истина)", () => {
      expect(() =>
        importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["string"] } as any, "Истина")
      ).toThrowError("MetadataValue: ожидались [string], получен boolean в fromYAML")
    })

    it("должен бросить при valueType: [string] и фактическом decimal", () => {
      expect(() =>
        importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["string"] } as any, 10)
      ).toThrowError("MetadataValue: ожидались [string], получен decimal в fromYAML")
    })

    it("должен бросить при valueType: [string] и объектном FormChoiceListDesTimeValue", () => {
      expect(() =>
        importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["string"] } as any, {
          Представление: "Физическое лицо",
          Значение: '"ФЛ"',
        })
      ).toThrowError("MetadataValue: ожидались [string], получен formChoiceListDesTimeValue в fromYAML")
    })

    it("не перехватывает объект с неизвестным вариантом как StandardPeriod", () => {
      const result = importMetadataValueFromYAML(mockContext, undefined, {
        Вариант: "ПроизвольнаяДата",
        Дата: "01.01.0001 00:00:00",
      } as any)

      expect(result).toBeUndefined()
    })
  })
})
