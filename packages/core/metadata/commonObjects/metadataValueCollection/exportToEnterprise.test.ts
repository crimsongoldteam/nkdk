import { describe, expect, it } from "vitest"
import { multiple, multipleEnterprise, single, singleEnterprise } from "~/tests/fixtures/metadataValueCollection/data"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataValueCollectionToEnterprise } from "./exportToEnterprise"

describe("exportMetadataValueCollectionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockСontext, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockСontext, single)

    expect(result).toEqual(singleEnterprise)
  })

  it("should export with multiple values", () => {
    const result = exportMetadataValueCollectionToEnterprise(mockСontext, multiple)

    expect(result).toEqual(multipleEnterprise)
  })
})
