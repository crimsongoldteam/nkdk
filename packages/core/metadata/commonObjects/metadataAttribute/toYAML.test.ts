import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributes,
  fullMetadataAttributesYAML,
  shortMetadataAttribute,
  shortMetadataAttributeYAML,
  shortMultilanguageMetadataAttribute,
  shortMultilanguageMetadataAttributeYAML,
  skipSynonymFromMetadataAttribute,
  skipSynonymFromMetadataAttributeYAML,
} from "./__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportMetadataAttributesToYAML } from "./register"

describe("export MetadataAttributes to YAML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToYAML(mockContext, undefined, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataAttributesToYAML(mockContext, undefined, fullMetadataAttributes)
    expect(result).toEqual(fullMetadataAttributesYAML)
  })

  it("should export with short format", () => {
    const result = exportMetadataAttributesToYAML(mockContext, undefined, shortMetadataAttribute)
    expect(result).toEqual(shortMetadataAttributeYAML)
  })

  it("should skip synonym if it is equal to name", () => {
    const result = exportMetadataAttributesToYAML(mockContext, undefined, skipSynonymFromMetadataAttribute)
    expect(result).toEqual(skipSynonymFromMetadataAttributeYAML)
  })

  it("should export with short multilanguage format", () => {
    const result = exportMetadataAttributesToYAML(mockContext, undefined, shortMultilanguageMetadataAttribute)
    expect(result).toEqual(shortMultilanguageMetadataAttributeYAML)
  })
})
