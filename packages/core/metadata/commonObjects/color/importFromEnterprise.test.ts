import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importColorFromEnterprise } from "./importFromEnterprise"

describe("importColorFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importColorFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases.filter((testCase) => testCase.fixture))(
    "should import $name from Enterprise",
    ({ colorEnterprise, color }) => {
      const result = importColorFromEnterprise(mockContext, mockRule, colorEnterprise)

      expect(result).toEqual(color)
    }
  )
})
