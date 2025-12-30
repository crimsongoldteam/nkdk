import { describe, expect, it, test } from "vitest"
import { tableMetadataObjects } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataTypeToEnterprise } from "./exportToEnterprise"

describe("exportMetadataTypeToEnterprise", () => {
  test.each(tableMetadataObjects)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataTypeToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })

  it("should return undefined for not two parts type", () => {
    const result = exportMetadataTypeToEnterprise(mockСontext, "TypeObject")
    expect(result).toBeUndefined()
  })
  it("should return undefined for wrong type", () => {
    const result = exportMetadataTypeToEnterprise(mockСontext, "WrongType.Object")
    expect(result).toBeUndefined()
  })
})
