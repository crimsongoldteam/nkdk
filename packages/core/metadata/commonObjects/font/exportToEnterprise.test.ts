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
import { exportFontToEnterprise } from "./exportToEnterprise"

describe("exportFontToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFontToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export normal minimal font to Enterprise", () => {
    const result = exportFontToEnterprise(mockСontext, normalMinimalFont)

    expect(result).toEqual(normalMinimalFontEnterprise)
  })

  it("should export system minimal font to Enterprise", () => {
    const result = exportFontToEnterprise(mockСontext, systemMinimalFont)

    expect(result).toEqual(systemMinimalFontEnterprise)
  })

  it("should export style minimal font to Enterprise", () => {
    const result = exportFontToEnterprise(mockСontext, styleMinimalFont)

    expect(result).toEqual(styleMinimalFontEnterprise)
  })

  it("should export normal full font to Enterprise", () => {
    const result = exportFontToEnterprise(mockСontext, normalFullFont)

    expect(result).toEqual(normalFullFontEnterprise)
  })

  it("should export style full font to Enterprise", () => {
    const result = exportFontToEnterprise(mockСontext, styleFullFont)

    expect(result).toEqual(styleFullFontEnterprise)
  })

  it("should export system full font to Enterprise", () => {
    const result = exportFontToEnterprise(mockСontext, systemFullFont)

    expect(result).toEqual(systemFullFontEnterprise)
  })
})
