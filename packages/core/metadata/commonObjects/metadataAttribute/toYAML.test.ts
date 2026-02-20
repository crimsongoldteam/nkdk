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
} from "~/tests/fixtures/metadataAttribute/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportMetadataAttributesToYAML } from "./toYAML"

describe("exportMetadataAttributeToYAML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToYAML(mockContextToYAML, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataAttributesToYAML(mockContextToYAML, mockRule, fullMetadataAttributes)

    expect(result).toEqual(fullMetadataAttributesYAML)
  })

  // it("should export minimal", () => {
  //   const result = exportMetadataAttributesToYAML(mockContext, mockRule, minimal)

  //   expect(result).toEqual(minimalYAML)
  // })

  it("should export with short format", () => {
    const result = exportMetadataAttributesToYAML(mockContextToYAML, mockRule, shortMetadataAttribute)

    expect(result).toEqual(shortMetadataAttributeYAML)
  })

  it("should skip synonym if it is equal to name", () => {
    const result = exportMetadataAttributesToYAML(mockContextToYAML, mockRule, skipSynonymFromMetadataAttribute)

    expect(result).toEqual(skipSynonymFromMetadataAttributeYAML)
  })

  it("should export with short multilanguage format", () => {
    const result = exportMetadataAttributesToYAML(mockContextToYAML, mockRule, shortMultilanguageMetadataAttribute)

    expect(result).toEqual(shortMultilanguageMetadataAttributeYAML)
  })
})
