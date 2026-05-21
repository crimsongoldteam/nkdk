import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataFieldStringFromYAML, importMetadataValueStringFromYAML } from "./fromYAML"

describe("importMetadataFieldFromYAML", () => {
  test.each(tableMetadataFields)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataFieldStringFromYAML(mockContext, mockRule, enterpriseValue)
    expect(result).toEqual(expected)
  })
})

describe("importMetadataValueStringFromYAML", () => {
  test.each(tableMetadataValues)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataValueStringFromYAML(mockContext, mockRule, enterpriseValue)
    expect(result).toEqual(expected)
  })

  test("keeps user-defined value path segment that matches metadata type alias literal", () => {
    expect(importMetadataValueStringFromYAML(mockContext, mockRule, "ОбщаяКоманда.ПланСчетов")).toBe(
      "CommonCommand.ПланСчетов"
    )
  })

  test("converts real value path category and empty reference segments", () => {
    expect(importMetadataValueStringFromYAML(mockContext, mockRule, "ПланСчетов.Хозрасчетный.ПустаяСсылка")).toBe(
      "ChartOfAccounts.Хозрасчетный.EmptyRef"
    )
  })
})
