import { describe, expect, test } from "vitest"
import { tableMetadataFields, tableMetadataTypes, tableMetadataValues } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import {
  importMetadataFieldFromEnterprise,
  importMetadataTypeFromEnterprise,
  importMetadataValueFromEnterprise,
} from "./importFromEnterprise"

describe("importMetadataTypeFromEnterprise", () => {
  test.each(tableMetadataTypes)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataTypeFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })
})

describe("importMetadataFieldFromEnterprise", () => {
  test.each(tableMetadataFields)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataFieldFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })
})

describe("importMetadataValueFromEnterprise", () => {
  test.each(tableMetadataValues)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataValueFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })
})
