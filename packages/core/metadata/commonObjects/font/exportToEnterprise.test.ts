import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFontToYAML } from "./toYAML"

describe("exportFontToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFontToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("should export $name font to YAML", ({ font, enterprise }) => {
    const result = exportFontToYAML(mockContext, mockRule, font)

    expect(result).toEqual(enterprise)
  })
})
