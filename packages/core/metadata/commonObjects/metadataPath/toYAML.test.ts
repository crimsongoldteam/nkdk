import { describe, expect, it, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "~/metadata/commonObjects/metadataPath/__fixtures__/table"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataFieldStringToYAML, exportMetadataObjectStringToYAML, exportMetadataValueStringToYAML } from "./toYAML"

describe("exportMetadataFieldToYAML", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldStringToYAML(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })

  test("exports full field path with service segments", () => {
    expect(
      exportMetadataFieldStringToYAML(
        mockContext,
        mockRule,
        "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество"
      )
    ).toBe("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество")
  })

  test("keeps user-defined field path segment that matches metadata type alias literal", () => {
    expect(exportMetadataFieldStringToYAML(mockContext, mockRule, "Document.Продажа.Attribute.Документ")).toBe(
      "Документ.Продажа.Реквизит.Документ"
    )
  })
})

describe("exportMetadataValueStringToYAML", () => {
  test.each(tableMetadataValues)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataValueStringToYAML(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })

  test("keeps user-defined value path segment that matches metadata type alias literal", () => {
    expect(exportMetadataValueStringToYAML(mockContext, mockRule, "Catalog.ИмяСправочника.ПланСчетов")).toBe(
      "Справочник.ИмяСправочника.ПланСчетов"
    )
  })
})

describe("metadataTarget diagnostics switch", () => {
  it("keeps canonical metadata object path when metadata target validation is disabled for YAML export", () => {
    const context = {
      ...mockContext,
      exportToYAML: {
        ...mockContext.exportToYAML!,
        validateMetadataTargets: false,
      },
    }
    const reference = "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства"

    expect(() => exportMetadataObjectStringToYAML(mockContext, mockRule, reference)).toThrow(
      'Неизвестный сегмент "Table"'
    )
    expect(exportMetadataObjectStringToYAML(context, mockRule, reference)).toBe(reference)
  })
})
