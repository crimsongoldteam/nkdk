import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
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
