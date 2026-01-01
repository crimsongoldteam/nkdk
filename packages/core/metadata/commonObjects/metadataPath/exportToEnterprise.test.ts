import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataTypes, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import {
  exportMetadataFieldToEnterprise,
  exportMetadataTypeToEnterprise,
  exportMetadataValueToEnterprise,
} from "./exportToEnterprise"

describe("exportMetadataTypeToEnterprise", () => {
  test.each(tableMetadataTypes)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataTypeToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })
})

describe("exportMetadataFieldToEnterprise", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })
})

describe("exportMetadataValueToEnterprise", () => {
  test.each(tableMetadataValues)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataValueToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })
})
