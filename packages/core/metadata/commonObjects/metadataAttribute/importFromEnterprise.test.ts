import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributes,
  fullMetadataAttributesEnterprise,
  minimalMetadataAttributes,
  minimalMetadataAttributesEnterprise,
  shortMetadataAttribute,
  shortMetadataAttributeEnterprise,
  shortMultilanguageMetadataAttribute,
  shortMultilanguageMetadataAttributeEnterprise,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataAttributesFromEnterprise } from "./importFromEnterprise"

describe("importMetadataAttributeFromEnterprise", () => {
  it("shouldreturn undefined when data is undefined", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, fullMetadataAttributesEnterprise)

    expect(result).toEqual(fullMetadataAttributes)
  })

  it("should import minimal", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, minimalMetadataAttributesEnterprise)

    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import with short format", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, shortMetadataAttributeEnterprise)

    expect(result).toEqual(shortMetadataAttribute)
  })

  it("should import short multilanguage format", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, shortMultilanguageMetadataAttributeEnterprise)

    expect(result).toEqual(shortMultilanguageMetadataAttribute)
  })
})
