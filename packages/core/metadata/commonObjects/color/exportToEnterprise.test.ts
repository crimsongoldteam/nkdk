import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportColorToYAML } from "./toYAML"

describe("exportColorToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportColorToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases)("should export $name to YAML", ({ color, enterpriseExpected }) => {
    const result = exportColorToYAML(mockContext, mockRule, color)

    expect(result).toEqual(enterpriseExpected)
  })
})
