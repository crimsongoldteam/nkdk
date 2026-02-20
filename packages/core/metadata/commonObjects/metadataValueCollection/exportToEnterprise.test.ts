import { describe, expect, it } from "vitest"
import { multiple, multipleYAML, single, singleYAML } from "~/tests/fixtures/metadataValueCollection/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataValueCollectionToYAML } from "./toYAML"

describe("exportMetadataValueCollectionToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataValueCollectionToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataValueCollectionToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const result = exportMetadataValueCollectionToYAML(mockContext, mockRule, single)

    expect(result).toEqual(singleYAML)
  })

  it("should export with multiple values", () => {
    const result = exportMetadataValueCollectionToYAML(mockContext, mockRule, multiple)

    expect(result).toEqual(multipleYAML)
  })
})
