import { describe, expect, it } from "vitest"
import { multiple, multipleEnterprise, single, singleEnterprise } from "~/tests/fixtures/metadataValueCollection/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataValueCollectionFromEnterprise } from "./importFromEnterprise"

describe("importMetadataValueCollectionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockContext, mockRule, singleEnterprise)

    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockContext, mockRule, multipleEnterprise)

    expect(result).toEqual(multiple)
  })
})
