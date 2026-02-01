import { describe, expect, it } from "vitest"
import { all, allEnterprise, minimal, minimalEnterprise } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockContext } from "~/tests/mockContext"
import { importStandardAttributeDescriptionsFromEnterprise } from "./importFromEnterprise"

describe("importStandardAttributeDescriptionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importStandardAttributeDescriptionsFromEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when object is empty", () => {
    const result = importStandardAttributeDescriptionsFromEnterprise(mockContext, {})
    expect(result).toBeUndefined()
  })

  it("should import all parameters from enterprise", () => {
    const result = importStandardAttributeDescriptionsFromEnterprise(mockContext, allEnterprise)

    expect(result).toEqual(all)
  })

  it("should import with only name", () => {
    const result = importStandardAttributeDescriptionsFromEnterprise(mockContext, minimalEnterprise)
    expect(result).toEqual(minimal)
  })
})
