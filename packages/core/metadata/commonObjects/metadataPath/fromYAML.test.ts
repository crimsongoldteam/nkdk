import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "~/metadata/commonObjects/metadataPath/__fixtures__/table"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importMetadataFieldStringFromYAML,
  importMetadataObjectStringFromYAML,
  importMetadataValueStringFromYAML,
} from "./fromYAML"

describe("importMetadataFieldFromYAML", () => {
  test.each(tableMetadataFields)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataFieldStringFromYAML(mockContext, mockRule, enterpriseValue)
    expect(result).toEqual(expected)
  })

  test("imports full field path with service segments", () => {
    expect(
      importMetadataFieldStringFromYAML(
        mockContext,
        mockRule,
        "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество"
      )
    ).toBe("Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество")
  })

  test("rejects short field path without service segments", () => {
    expect(() =>
      importMetadataFieldStringFromYAML(mockContext, mockRule, "Справочник.Номенклатура.Количество")
    ).toThrow('Неизвестный сегмент "Количество"')
  })

  test("rejects English YAML root", () => {
    expect(() => importMetadataFieldStringFromYAML(mockContext, mockRule, "Catalog.Контрагенты")).toThrow(
      'Неизвестный корень "Catalog"'
    )
  })
})

describe("importMetadataValueStringFromYAML", () => {
  test.each(tableMetadataValues)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataValueStringFromYAML(mockContext, mockRule, enterpriseValue)
    expect(result).toEqual(expected)
  })

  test("keeps user-defined value path segment that matches metadata type alias literal", () => {
    expect(importMetadataValueStringFromYAML(mockContext, mockRule, "Справочник.ИмяСправочника.ПланСчетов")).toBe(
      "Catalog.ИмяСправочника.ПланСчетов"
    )
  })

  test("converts real value path category and empty reference segments", () => {
    expect(importMetadataValueStringFromYAML(mockContext, mockRule, "ПланСчетов.Хозрасчетный.ПустаяСсылка")).toBe(
      "ChartOfAccounts.Хозрасчетный.EmptyRef"
    )
  })
})

describe("metadataTarget diagnostics switch", () => {
  test("keeps canonical metadata object path when metadata target validation is disabled for YAML import", () => {
    const context = {
      ...mockContext,
      importFromYAML: {
        validateMetadataTargets: false,
      },
    }
    const reference = "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства"

    expect(() => importMetadataObjectStringFromYAML(mockContext, mockRule, reference)).toThrow()
    expect(importMetadataObjectStringFromYAML(context, mockRule, reference)).toBe(reference)
  })
})
