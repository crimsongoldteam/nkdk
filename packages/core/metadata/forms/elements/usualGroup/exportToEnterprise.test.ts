import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/exportToEnterprise"
import "~/metadata/forms/elements/exportToEnterprise"
import "~/metadata/forms/elements/usualGroup/rules"
import "~/metadata/systemEnumerations/exportToEnterprise"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  minimalUsualGroup,
  minimalUsualGroupPartialEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportUsualGroupPartialToEnterprise } from "./exportToEnterprise"

describe("exportUsualGroupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportUsualGroupPartialToEnterprise(mockContext, mockRule, fullUsualGroup)

    expect(result).toEqual(fullUsualGroupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportUsualGroupPartialToEnterprise(mockContext, mockRule, minimalUsualGroup)

    expect(result).toEqual(minimalUsualGroupPartialEnterprise)
  })
})
