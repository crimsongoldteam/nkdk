import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/metadata/commonObjects/color/__fixtures__/data"
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

  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("exports raw XML color ref %s to YAML", (rawRef) => {
    const result = exportColorToYAML(mockContext, mockRule, { rawRef })

    expect(result).toBe(rawRef)
  })
})
