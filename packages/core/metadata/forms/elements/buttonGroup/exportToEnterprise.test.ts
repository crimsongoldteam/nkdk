import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupPartialEnterprise,
  fullButtonGroupTypedEnterprise,
  minimalButtonGroup,
  minimalButtonGroupPartialEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportButtonGroupPartialToEnterprise, exportButtonGroupTypedToEnterprise } from "./exportToEnterprise"

describe("exportButtonGroupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonGroupPartialToEnterprise(mockContext, mockRule, fullButtonGroup)

    expect(result).toEqual(fullButtonGroupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportButtonGroupPartialToEnterprise(mockContext, mockRule, minimalButtonGroup)

    expect(result).toEqual(minimalButtonGroupPartialEnterprise)
  })
})

describe("exportButtonGroupTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonGroupTypedToEnterprise(mockContext, mockRule, fullButtonGroup)

    expect(result).toEqual(fullButtonGroupTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportButtonGroupTypedToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
