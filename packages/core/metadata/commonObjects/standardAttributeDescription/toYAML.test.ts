import { describe, expect, it } from "vitest"
import { all, allYAML, minimal, minimalYAML } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportStandardAttributeDescriptionsToYAML } from "./toYAML"

describe("exportStandardAttributeDescriptionToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportStandardAttributeDescriptionsToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when array is empty", () => {
    const result = exportStandardAttributeDescriptionsToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export all parameters to enterprise", () => {
    const result = exportStandardAttributeDescriptionsToYAML(mockContext, mockRule, all)

    expect(result).toEqual(allYAML)
  })

  it("should export with only name", () => {
    const result = exportStandardAttributeDescriptionsToYAML(mockContext, mockRule, minimal)
    expect(result).toEqual(minimalYAML)
  })
})
