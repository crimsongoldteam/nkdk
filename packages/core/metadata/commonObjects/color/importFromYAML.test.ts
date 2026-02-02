import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importColorFromYAML } from "./importFromYAML"

describe("importColorFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importColorFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases.filter((testCase) => testCase.fixture))(
    "should import $name from YAML",
    ({ colorEnterprise, color }) => {
      const result = importColorFromYAML(mockContext, mockRule, colorEnterprise)

      expect(result).toEqual(color)
    }
  )
})
