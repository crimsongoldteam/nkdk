import { describe, expect, it, test } from "vitest"
import { tableMetadataFields, tableMetadataObjects } from "~/tests/fixtures/metadataPath/table"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataFieldToEnterprise, exportMetadataTypeToEnterprise } from "./exportToEnterprise"

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

describe("exportMetadataFieldToEnterprise", () => {
  test.each(tableMetadataFields)("export %s to %s", (expected: string, enterpriseValue: string) => {
    const result = exportMetadataFieldToEnterprise(mockСontext, expected)
    expect(result).toEqual(enterpriseValue)
  })

  // it("should return undefined for not two parts type", () => {
  //   const result = exportMetadataFieldToEnterprise(mockСontext, "TypeObject")
  //   expect(result).toBeUndefined()
  // })
  // it("should return undefined for wrong type", () => {
  //   const result = exportMetadataFieldToEnterprise(mockСontext, "WrongType.Object")
  //   expect(result).toBeUndefined()
  // })
})
