import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataFieldStringToEnterprise, exportMetadataValueStringToEnterprise } from "./exportToEnterprise"

describe("exportMetadataFieldToEnterprise", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldStringToEnterprise(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })
})

describe("exportMetadataValueStringToEnterprise", () => {
  test.each(tableMetadataValues)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataValueStringToEnterprise(mockContext, mockRule, expected)
    expect(result).toEqual(enterpriseValue)
  })
})
