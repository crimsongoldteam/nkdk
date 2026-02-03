import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributes,
  fullMetadataAttributesEnterprise,
  shortMetadataAttribute,
  shortMetadataAttributeEnterprise,
  shortMultilanguageMetadataAttribute,
  shortMultilanguageMetadataAttributeEnterprise,
  skipSynonymFromMetadataAttribute,
  skipSynonymFromMetadataAttributeEnterprise,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataAttributesToEnterprise } from "./exportToEnterprise"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, mockRule, fullMetadataAttributes)

    expect(result).toEqual(fullMetadataAttributesEnterprise)
  })

  // it("should export minimal", () => {
  //   const result = exportMetadataAttributesToEnterprise(mockContext, mockRule, minimal)

  //   expect(result).toEqual(minimalEnterprise)
  // })

  it("should export with short format", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, mockRule, shortMetadataAttribute)

    expect(result).toEqual(shortMetadataAttributeEnterprise)
  })

  it("should skip synonym if it is equal to name", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, mockRule, skipSynonymFromMetadataAttribute)

    expect(result).toEqual(skipSynonymFromMetadataAttributeEnterprise)
  })

  it("should export with short multilanguage format", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, mockRule, shortMultilanguageMetadataAttribute)

    expect(result).toEqual(shortMultilanguageMetadataAttributeEnterprise)
  })
})
