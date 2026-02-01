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
import { mockContext } from "~/tests/mockContext"
import { importMetadataAttributesFromEnterprise } from "./importFromEnterprise"

describe("importMetadataAttributeFromEnterprise", () => {
  it("shouldreturn undefined when data is undefined", () => {
    const result = importMetadataAttributesFromEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataAttributesFromEnterprise(mockContext, fullMetadataAttributesEnterprise)

    expect(result).toEqual(fullMetadataAttributes)
  })

  it("should import minimal", () => {
    const result = importMetadataAttributesFromEnterprise(mockContext, minimalMetadataAttributesEnterprise)

    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import with short format", () => {
    const result = importMetadataAttributesFromEnterprise(mockContext, shortMetadataAttributeEnterprise)

    expect(result).toEqual(shortMetadataAttribute)
  })

  it("should import short multilanguage format", () => {
    const result = importMetadataAttributesFromEnterprise(mockContext, shortMultilanguageMetadataAttributeEnterprise)

    expect(result).toEqual(shortMultilanguageMetadataAttribute)
  })
})
