import { describe, expect, it } from "vitest"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  fullUsualGroupTypedEnterprise,
  minimalUsualGroup,
  minimalUsualGroupPartialEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportUsualGroupPartialToEnterprise, exportUsualGroupTypedToEnterprise } from "./exportToEnterprise"

describe("exportUsualGroupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportUsualGroupPartialToEnterprise(mockContext, fullUsualGroup)

    expect(result).toEqual(fullUsualGroupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportUsualGroupPartialToEnterprise(mockContext, minimalUsualGroup)

    expect(result).toEqual(minimalUsualGroupPartialEnterprise)
  })
})

describe("exportUsualGroupTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportUsualGroupTypedToEnterprise(mockContext, fullUsualGroup)

    expect(result).toEqual(fullUsualGroupTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportUsualGroupTypedToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })
})
