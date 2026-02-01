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
import { mockContext } from "~/tests/mockContext"
import { exportMetadataAttributesToEnterprise } from "./exportToEnterprise"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, fullMetadataAttributes)

    expect(result).toEqual(fullMetadataAttributesEnterprise)
  })

  // it("should export minimal", () => {
  //   const result = exportMetadataAttributesToEnterprise(mockContext, minimal)

  //   expect(result).toEqual(minimalEnterprise)
  // })

  it("should export with short format", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, shortMetadataAttribute)

    expect(result).toEqual(shortMetadataAttributeEnterprise)
  })

  it("should skip synonym if it is equal to name", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, skipSynonymFromMetadataAttribute)

    expect(result).toEqual(skipSynonymFromMetadataAttributeEnterprise)
  })

  it("should export with short multilanguage format", () => {
    const result = exportMetadataAttributesToEnterprise(mockContext, shortMultilanguageMetadataAttribute)

    expect(result).toEqual(shortMultilanguageMetadataAttributeEnterprise)
  })
})
