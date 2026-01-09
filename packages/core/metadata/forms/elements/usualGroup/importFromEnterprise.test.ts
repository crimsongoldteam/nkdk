import { describe, expect, it } from "vitest"
import {
  fullUsualGroup,
  fullUsualGroupEnterprise,
  minimalUsualGroup,
  minimalUsualGroupEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importUsualGroupFromEnterprise } from "./importFromEnterprise"

describe("importUsualGroupFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importUsualGroupFromEnterprise(mockСontext, undefined, fullUsualGroup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importUsualGroupFromEnterprise(mockСontext, fullUsualGroupEnterprise, fullUsualGroup.name)

    expect(result).toEqual(fullUsualGroup)
  })

  it("should import minimal", () => {
    const result = importUsualGroupFromEnterprise(mockСontext, minimalUsualGroupEnterprise, minimalUsualGroup.name)

    expect(result).toEqual(minimalUsualGroup)
  })
})

