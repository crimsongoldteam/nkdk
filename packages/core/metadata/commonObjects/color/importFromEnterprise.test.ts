import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockСontext } from "~/tests/mockContext"
import { importColorFromEnterprise } from "./importFromEnterprise"

describe("importColorFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importColorFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases.filter((testCase) => testCase.fixture))(
    "should import $name from Enterprise",
    ({ colorEnterprise, color }) => {
      const result = importColorFromEnterprise(mockСontext, colorEnterprise)

      expect(result).toEqual(color)
    }
  )
})
