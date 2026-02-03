import { describe, expect, it } from "vitest"
import { multiple, multipleEnterprise, single, singleEnterprise } from "~/tests/fixtures/metadataValueCollection/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataValueCollectionToEnterprise } from "./exportToEnterprise"

describe("exportMetadataValueCollectionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockContext, mockRule, single)

    expect(result).toEqual(singleEnterprise)
  })

  it("should export with multiple values", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockContext, mockRule, multiple)

    expect(result).toEqual(multipleEnterprise)
  })
})
