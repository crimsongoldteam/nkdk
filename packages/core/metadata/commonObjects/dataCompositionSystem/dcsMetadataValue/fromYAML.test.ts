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
