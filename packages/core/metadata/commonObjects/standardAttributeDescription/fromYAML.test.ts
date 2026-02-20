import { describe, expect, it } from "vitest"
import { all, allYAML, minimal, minimalYAML } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importStandardAttributeDescriptionsFromYAML } from "./fromYAML"

describe("importStandardAttributeDescriptionFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importStandardAttributeDescriptionsFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when object is empty", () => {
    const result = importStandardAttributeDescriptionsFromYAML(mockContext, mockRule, {})
    expect(result).toBeUndefined()
  })

  it("should import all parameters from enterprise", () => {
    const result = importStandardAttributeDescriptionsFromYAML(mockContext, mockRule, allYAML)

    expect(result).toEqual(all)
  })

  it("should import with only name", () => {
    const result = importStandardAttributeDescriptionsFromYAML(mockContext, mockRule, minimalYAML)
    expect(result).toEqual(minimal)
  })
})
