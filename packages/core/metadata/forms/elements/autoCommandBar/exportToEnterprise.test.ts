import { describe, expect, it } from "vitest"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportAutoCommandBarToEnterprise } from "./exportToEnterprise"

describe("exportAutoCommandBarToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportAutoCommandBarToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportAutoCommandBarToEnterprise(mockContext, mockRule, fullAutoCommandBar)

    expect(result).toEqual(fullAutoExportCommandBarEnterprise)
  })

  it("should export minimal", () => {
    const result = exportAutoCommandBarToEnterprise(mockContext, mockRule, minimalAutoCommandBar)

    expect(result).toBeUndefined()
  })
})
