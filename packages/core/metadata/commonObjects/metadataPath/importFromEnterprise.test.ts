import { describe, expect, it, test } from "vitest"
import { tableMetadataFields, tableMetadataObjects } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataFieldFromEnterprise, importMetadataTypeFromEnterprise } from "./importFromEnterprise"

describe("importMetadataTypeFromEnterprise", () => {
  test.each(tableMetadataObjects)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataTypeFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })

  it("should return undefined for not two parts type", () => {
    const result = importMetadataTypeFromEnterprise(mockСontext, "TypeObject")
    expect(result).toBeUndefined()
  })
  it("should return undefined for wrong type", () => {
    const result = importMetadataTypeFromEnterprise(mockСontext, "WrongType.Object")
    expect(result).toBeUndefined()
  })
})

describe("importMetadataFieldFromEnterprise", () => {
  test.each(tableMetadataFields)("import %s from %s", (expected: string, enterpriseValue: string) => {
    const result = importMetadataFieldFromEnterprise(mockСontext, enterpriseValue)
    expect(result).toEqual(expected)
  })
})
