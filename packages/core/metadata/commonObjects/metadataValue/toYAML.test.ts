import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "./__fixtures__/data"
import { mockContext } from "../../../tests/mockContext"
import { exportToYAML } from "../../../yaml/export"
import { isExplicitYAMLString } from "../../../yaml/explicitString"
import { exportMetadataValueToYAML } from "./toYAML"

describe("exportMetadataValueToYAML", () => {
  it.each(metadataValueFixtures)("should export $name value to YAML", (fixture) => {
    const result = exportMetadataValueToYAML(mockContext, fixture.rule as any, fixture.internal as any)
    expect(result).toEqual(fixture.YAML)
  })

  it("exports DataCompositionComparisonType to YAML", () => {
    const result = exportMetadataValueToYAML(
      mockContext,
      { type: "MetadataValue", valueType: ["DataCompositionComparisonType"] } as any,
      { type: "DataCompositionComparisonType", value: "Equal" } as any
    )

    expect(result).toEqual("Равно")
  })

  it("exports AccountType to explicit YAML", () => {
    const result = exportMetadataValueToYAML(
      mockContext,
      { type: "MetadataValue" } as any,
      { type: "AccountType", value: "ActivePassive" } as any
    )

    expect(result).toEqual({ Тип: "ВидСчета", Значение: "АктивноПассивный" })
  })

  it("exports metadata target value references to YAML", () => {
    expect(
      exportMetadataValueToYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        { type: "ref", value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком" } as any
      )
    ).toEqual("Перечисление.ВидыДоговоров.СПоставщиком")

    expect(
      exportMetadataValueToYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        { type: "ref", value: "Catalog.СтавкиНДС.EmptyRef" } as any
      )
    ).toEqual("Справочник.СтавкиНДС.ПустаяСсылка")
  })

  it("keeps uuid design-time references as YAML ref values", () => {
    const value = "447e2bd8-fa43-442e-91db-b17634e036d9.c26f06ab-fb3e-46a7-a391-fdccd77b4231"

    expect(
      exportMetadataValueToYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        { type: "ref", value } as any
      )
    ).toEqual(value)
  })

  it("exports string MetadataValue as an explicit YAML string marker", () => {
    const result = exportMetadataValueToYAML(
      mockContext,
      { type: "MetadataValue" } as any,
      { type: "string", value: "456" } as any
    )

    expect(isExplicitYAMLString(result)).toBe(true)
    expect(exportToYAML({ "Отбор.Код": result })).toBe('Отбор.Код: "456"')
  })

  describe("строгая валидация valueType", () => {
    it("должен бросить при valueType: [string] и фактическом boolean", () => {
      expect(() =>
        exportMetadataValueToYAML(
          mockContext,
          { type: "MetadataValue", valueType: ["string"] } as any,
          { type: "boolean", value: true } as any
        )
      ).toThrowError("MetadataValue: ожидались [string], получен boolean в toYAML")
    })

    it("должен бросить при valueType: [string] и фактическом decimal", () => {
      expect(() =>
        exportMetadataValueToYAML(
          mockContext,
          { type: "MetadataValue", valueType: ["string"] } as any,
          { type: "decimal", value: 10 } as any
        )
      ).toThrowError("MetadataValue: ожидались [string], получен decimal в toYAML")
    })
  })
})
