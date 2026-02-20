import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributes,
  fullMetadataAttributesYAML,
  minimalMetadataAttributes,
  minimalMetadataAttributesYAML,
  shortMetadataAttribute,
  shortMetadataAttributeYAML,
  shortMultilanguageMetadataAttribute,
  shortMultilanguageMetadataAttributeYAML,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataAttributesFromYAML } from "./fromYAML"

describe("importMetadataAttributeFromYAML", () => {
  it("shouldreturn undefined when data is undefined", () => {
    const result = importMetadataAttributesFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataAttributesFromYAML(mockContext, mockRule, fullMetadataAttributesYAML)

    expect(result).toEqual(fullMetadataAttributes)
  })

  it("should import minimal", () => {
    const result = importMetadataAttributesFromYAML(mockContext, mockRule, minimalMetadataAttributesYAML)

    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import with short format", () => {
    const result = importMetadataAttributesFromYAML(mockContext, mockRule, shortMetadataAttributeYAML)

    expect(result).toEqual(shortMetadataAttribute)
  })

  it("should import short multilanguage format", () => {
    const result = importMetadataAttributesFromYAML(mockContext, mockRule, shortMultilanguageMetadataAttributeYAML)

    expect(result).toEqual(shortMultilanguageMetadataAttribute)
  })
})
