import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataObjects } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataFieldToEnterprise, exportMetadataTypeToEnterprise } from "./exportToEnterprise"

describe("exportMetadataTypeToEnterprise", () => {
  test.each(tableMetadataObjects)("export %s to %s", (expected: string, enterpriseValue: string) => {
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
