import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
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
