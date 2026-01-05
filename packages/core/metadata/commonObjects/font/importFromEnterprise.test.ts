import { describe, expect, it } from "vitest"
import {
  normalFullFont,
  normalFullFontEnterprise,
  normalMinimalFont,
  normalMinimalFontEnterprise,
  styleFullFont,
  styleFullFontEnterprise,
  styleMinimalFont,
  styleMinimalFontEnterprise,
  systemFullFont,
  systemFullFontEnterprise,
  systemMinimalFont,
  systemMinimalFontEnterprise,
} from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { importFontFromEnterprise } from "./importFromEnterprise"

describe("importFontFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import normal minimal font from Enterprise", () => {
    const result = importFontFromEnterprise(mockСontext, normalMinimalFontEnterprise)

    expect(result).toEqual(normalMinimalFont)
  })

  it("should import system minimal font from Enterprise", () => {
    const result = importFontFromEnterprise(mockСontext, systemMinimalFontEnterprise)

    expect(result).toEqual(systemMinimalFont)
  })

  it("should import style minimal font from Enterprise", () => {
    const result = importFontFromEnterprise(mockСontext, styleMinimalFontEnterprise)

    expect(result).toEqual(styleMinimalFont)
  })

  it("should import normal full font from Enterprise", () => {
    const result = importFontFromEnterprise(mockСontext, normalFullFontEnterprise)

    expect(result).toEqual(normalFullFont)
  })

  it("should import style full font from Enterprise", () => {
    const result = importFontFromEnterprise(mockСontext, styleFullFontEnterprise)

    expect(result).toEqual(styleFullFont)
  })

  it("should import system full font from Enterprise", () => {
    const result = importFontFromEnterprise(mockСontext, systemFullFontEnterprise)

    expect(result).toEqual(systemFullFont)
  })
})
