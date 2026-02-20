import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importFontFromYAML } from "./fromYAML"

describe("importFontFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("should import $name font from YAML", ({ font, yaml: enterprise }) => {
    const result = importFontFromYAML(mockContext, mockRule, enterprise)

    expect(result).toEqual(font)
  })
})
