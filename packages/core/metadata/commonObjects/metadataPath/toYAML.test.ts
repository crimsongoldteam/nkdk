import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataFieldStringToYAML, exportMetadataValueStringToYAML } from "./toYAML"

describe("exportMetadataFieldToYAML", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldStringToYAML(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })
})

describe("exportMetadataValueStringToYAML", () => {
  test.each(tableMetadataValues)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataValueStringToYAML(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })
})
