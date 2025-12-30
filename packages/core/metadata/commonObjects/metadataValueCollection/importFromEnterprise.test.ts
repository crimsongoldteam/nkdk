import { describe, expect, it } from "vitest"
import { multiple, multipleEnterprise, single, singleEnterprise } from "~/tests/fixtures/metadataValueCollection/data"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataValueCollectionFromEnterprise } from "./importFromEnterprise"

describe("importMetadataValueCollectionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockСontext, [])
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockСontext, singleEnterprise)

    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const result = importMetadataValueCollectionFromEnterprise(mockСontext, multipleEnterprise)

    expect(result).toEqual(multiple)
  })
})
