import { describe, expect, it } from "vitest"
import { all, allEnterprise, minimal, minimalEnterprise } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockContext } from "~/tests/mockContext"
import { exportStandardAttributeDescriptionsToEnterprise } from "./exportToEnterprise"

describe("exportStandardAttributeDescriptionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when array is empty", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockContext, [])
    expect(result).toBeUndefined()
  })

  it("should export all parameters to enterprise", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockContext, all)

    expect(result).toEqual(allEnterprise)
  })

  it("should export with only name", () => {
    const result = exportStandardAttributeDescriptionsToEnterprise(mockContext, minimal)
    expect(result).toEqual(minimalEnterprise)
  })
})
