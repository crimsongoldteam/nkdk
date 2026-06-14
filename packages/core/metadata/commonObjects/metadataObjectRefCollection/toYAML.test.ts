import { describe, expect, it } from "vitest"
import { multiple, multipleYAML, single, singleYAML } from "~/metadata/commonObjects/metadataObjectRefCollection/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataObjectRefCollectionToYAML } from "./toYAML"

describe("exportMetadataObjectRefCollectionToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataObjectRefCollectionToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataObjectRefCollectionToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const result = exportMetadataObjectRefCollectionToYAML(mockContext, mockRule, single)

    expect(result).toEqual(singleYAML)
  })

  it("should export with multiple values", () => {
    const result = exportMetadataObjectRefCollectionToYAML(mockContext, mockRule, multiple)

    expect(result).toEqual(multipleYAML)
  })
})
