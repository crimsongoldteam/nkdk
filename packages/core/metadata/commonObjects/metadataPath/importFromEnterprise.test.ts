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
})
