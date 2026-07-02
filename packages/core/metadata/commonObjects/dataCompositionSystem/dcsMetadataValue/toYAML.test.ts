import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import { dcsMetadataValueYAMLFixtures } from "./__fixtures__/data"

describe("export MetadataDcsMetadataValue to YAML", () => {
  it.each(dcsMetadataValueYAMLFixtures)("exports $title", (fixture) => {
    expect(
      testExportPropertyToYAML({
        rule: fixture.rule,
        value: fixture.value,
      })
    ).toEqual({ value: fixture.yaml })
  })

  it("keeps local DCS field paths as strings", () => {
    expect(
      testExportPropertyToYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
        value: "Реквизит1",
      })
    ).toEqual({ value: "Реквизит1" })
  })

  it("exports DesignTimeValue LocalStringType with explicit YAML type", () => {
    expect(
      testExportPropertyToYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: { items: { ru: "ЧЦ=3; ЧДЦ=2" } },
      })
    ).toEqual({
      value: {
        Тип: "МногоязычнаяСтрока",
        Значение: "ЧЦ=3; ЧДЦ=2",
      },
    })
  })

  it("exports DesignTimeValue LocalFormattedStringType with explicit YAML type", () => {
    expect(
      testExportPropertyToYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          type: "LocalFormattedStringType",
          value: {
            formatted: true,
            items: { ru: "Многоязычная форматированная строка" },
          },
        },
      })
    ).toEqual({
      value: {
        Тип: "МногоязычнаяФорматированнаяСтрока",
        Значение: {
          Форматированный: "Истина",
          Текст: "Многоязычная форматированная строка",
        },
      },
    })
  })
})
