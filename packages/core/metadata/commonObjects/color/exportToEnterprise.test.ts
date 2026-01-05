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

describe("exportColorToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportColorToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export absolute color to Enterprise", () => {
    const result = exportColorToEnterprise(mockСontext, absoluteColor)

    expect(result).toEqual(absoluteColorEnterprise)
  })

  it("should export Windows color to Enterprise", () => {
    const result = exportColorToEnterprise(mockСontext, winColor)

    expect(result).toEqual(winColorEnterprise)
  })

  it("should export Web color to Enterprise", () => {
    const result = exportColorToEnterprise(mockСontext, webColor)

    expect(result).toEqual(webColorEnterprise)
  })

  it("should export style color to Enterprise", () => {
    const result = exportColorToEnterprise(mockСontext, styleColor)

    expect(result).toEqual(styleColorEnterprise)
  })
})
