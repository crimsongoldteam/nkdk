import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importFontFromYAML } from "./importFromYAML"

describe("importFontFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontEnterpriseFixtures)("should import $name font from YAML", ({ font, enterprise }) => {
    const result = importFontFromYAML(mockContext, mockRule, enterprise)

    expect(result).toEqual(font)
  })
})
