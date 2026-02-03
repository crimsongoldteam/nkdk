import { describe, expect, it } from "vitest"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandBarPartialToEnterprise } from "./exportToEnterprise"

describe("exportCommandBarPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportCommandBarPartialToEnterprise(mockContext, mockRule, fullCommandBar)

    expect(result).toEqual(fullCommandBarPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandBarPartialToEnterprise(mockContext, mockRule, minimalCommandBar)

    expect(result).toEqual(minimalCommandBarPartialEnterprise)
  })
})
