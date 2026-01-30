import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { importFontFromEnterprise } from "./importFromEnterprise"

describe("importFontFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontEnterpriseFixtures)("should import $name font from Enterprise", ({ font, enterprise }) => {
    const result = importFontFromEnterprise(mockСontext, enterprise)

    expect(result).toEqual(font)
  })
})
