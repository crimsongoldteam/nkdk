import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importColorFromYAML } from "./fromYAML"

describe("importColorFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importColorFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases.filter((testCase) => testCase.fixture))(
    "should import $name from YAML",
    ({ colorYAML, color }) => {
      const result = importColorFromYAML(mockContext, mockRule, colorYAML)

      expect(result).toEqual(color)
    }
  )
})
