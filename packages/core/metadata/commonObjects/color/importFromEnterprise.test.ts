import { describe, expect, it } from "vitest"
import {
  absoluteColor,
  absoluteColorEnterprise,
  styleColor,
  styleColorEnterprise,
  webColor,
  webColorEnterprise,
  winColor,
  winColorEnterprise,
} from "~/tests/fixtures/color/data"
import { mockСontext } from "~/tests/mockContext"
import { exportColorToEnterprise } from "./exportToEnterprise"
import { importColorFromEnterprise } from "./importFromEnterprise"

describe("importColorFromEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = importColorFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import absolute color from Enterprise", () => {
    const result = importColorFromEnterprise(mockСontext, absoluteColorEnterprise)

    expect(result).toEqual(absoluteColor)
  })

  it("should import Windows color from Enterprise", () => {
    const result = importColorFromEnterprise(mockСontext, winColorEnterprise)

    expect(result).toEqual(winColor)
  })

  it("should import Web color from Enterprise", () => {
    const result = importColorFromEnterprise(mockСontext, webColorEnterprise)

    expect(result).toEqual(webColor)
  })

  it("should import style color from Enterprise", () => {
    const result = importColorFromEnterprise(mockСontext, styleColorEnterprise)

    expect(result).toEqual(styleColor)
  })

  it("should export and import color correctly (round-trip)", () => {
    const colors = [absoluteColor, winColor, webColor, styleColor]

    for (const color of colors) {
      const exported = exportColorToEnterprise(mockСontext, color)
      const imported = importColorFromEnterprise(mockСontext, exported)

      expect(imported).toEqual(color)
    }
  })
})
