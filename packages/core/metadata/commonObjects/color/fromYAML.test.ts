import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/metadata/commonObjects/color/__fixtures__/data"
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

  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("imports raw XML color ref %s from YAML", (rawRef) => {
    const result = importColorFromYAML(mockContext, mockRule, rawRef)

    expect(result).toEqual({ rawRef })
  })

  it("does not treat malformed 0-prefixed strings as raw XML color refs", () => {
    const result = importColorFromYAML(mockContext, mockRule, "0:not-a-uuid")

    expect(result).toEqual({ type: "Absolute", value: "0:not-a-uuid" })
  })
})
