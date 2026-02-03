import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFontToEnterprise } from "./exportToEnterprise"

describe("exportFontToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFontToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontEnterpriseFixtures)("should export $name font to Enterprise", ({ font, enterprise }) => {
    const result = exportFontToEnterprise(mockContext, mockRule, font)

    expect(result).toEqual(enterprise)
  })
})
