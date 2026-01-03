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
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataAttributesToEnterprise } from "./exportToEnterprise"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, fullMetadataAttributes)

    expect(result).toEqual(fullMetadataAttributesEnterprise)
  })

  // it("should export minimal", () => {
  //   const result = exportMetadataAttributesToEnterprise(mockСontext, minimal)

  //   expect(result).toEqual(minimalEnterprise)
  // })

  it("should export with short format", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, shortMetadataAttribute)

    expect(result).toEqual(shortMetadataAttributeEnterprise)
  })

  it("should skip synonym if it is equal to name", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, skipSynonymFromMetadataAttribute)

    expect(result).toEqual(skipSynonymFromMetadataAttributeEnterprise)
  })

  it("should export with short multilanguage format", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, shortMultilanguageMetadataAttribute)

    expect(result).toEqual(shortMultilanguageMetadataAttributeEnterprise)
  })
})
