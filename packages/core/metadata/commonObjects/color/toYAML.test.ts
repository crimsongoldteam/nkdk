import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportColorToYAML } from "./toYAML"

describe("exportColorToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportColorToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases)("should export $name to YAML", ({ color, expectedYAML: enterpriseExpected }) => {
    const result = exportColorToYAML(mockContext, mockRule, color)

    expect(result).toEqual(enterpriseExpected)
  })

  it("should reject raw XML color ref", () => {
    expect(() =>
      exportColorToYAML(mockContext, mockRule, { rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da" })
    ).toThrow("Color YAML: rawRef is XML-only")
  })
})
