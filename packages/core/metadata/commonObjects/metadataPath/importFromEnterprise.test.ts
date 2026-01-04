import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import {
  importMetadataFieldStringFromEnterprise,
  importMetadataValueStringFromEnterprise,
} from "./importFromEnterprise"

describe("importMetadataFieldFromEnterprise", () => {
  test.each(tableMetadataFields)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataFieldStringFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })
})

describe("importMetadataValueStringFromEnterprise", () => {
  test.each(tableMetadataValues)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataValueStringFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })
})
