import { describe, expect, it } from "vitest"
import {
  fullUsualGroup,
  fullUsualGroupEnterprise,
  minimalUsualGroup,
  minimalUsualGroupEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportUsualGroupToEnterprise } from "./exportToEnterprise"

describe("exportUsualGroupToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsualGroupToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportUsualGroupToEnterprise(mockСontext, fullUsualGroup)

    expect(result).toEqual(fullUsualGroupEnterprise)
  })

  it("should export minimal", () => {
    const result = exportUsualGroupToEnterprise(mockСontext, minimalUsualGroup)

    expect(result).toEqual(minimalUsualGroupEnterprise)
  })
})

