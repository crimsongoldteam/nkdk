import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataTypes, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import {
  exportMetadataFieldStringToEnterprise,
  exportMetadataTypeStringToEnterprise,
  exportMetadataValueStringToEnterprise,
} from "./exportToEnterprise"

describe("exportMetadataTypeToEnterprise", () => {
  test.each(tableMetadataTypes)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataTypeStringToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })
})

describe("exportMetadataFieldToEnterprise", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldStringToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })
})

describe("exportMetadataValueStringToEnterprise", () => {
  test.each(tableMetadataValues)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataValueStringToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })
})
