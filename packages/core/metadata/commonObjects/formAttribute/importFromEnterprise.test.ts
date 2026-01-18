import { describe, expect, it } from "vitest"
import {
  fullFormAttributes,
  fullFormAttributesEnterprise,
  mainAttributeTitleEqualsName,
  mainAttributeTitleEqualsNameEnterprise,
  minimalFormAttributes,
  minimalFormAttributesEnterprise,
  shortFormAttribute,
  shortFormAttributeEnterprise,
} from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormAttributesFromEnterprise } from "./importFromEnterprise"

describe("importFormAttributesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, fullFormAttributesEnterprise)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, minimalFormAttributesEnterprise)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import with short format", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, shortFormAttributeEnterprise)

    expect(result).toEqual(shortFormAttribute)
  })

  it("should import title when mainAttribute=true and title equals name", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, mainAttributeTitleEqualsNameEnterprise)

    expect(result).toEqual(mainAttributeTitleEqualsName)
  })
})
