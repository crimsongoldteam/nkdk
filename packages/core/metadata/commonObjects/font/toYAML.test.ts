import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/metadata/commonObjects/font/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFontToYAML } from "./toYAML"

describe("exportFontToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFontToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("should export $name font to YAML", ({ font, yaml: enterprise }) => {
    const result = exportFontToYAML(mockContext, mockRule, font)

    expect(result).toEqual(enterprise)
  })

  it("exports raw non-prefixed ref with Russian font kind", () => {
    const result = exportFontToYAML(mockContext, mockRule, {
      ref: "0" as never,
      kind: "StyleItem",
      height: 10,
      rawRef: true,
    })

    expect(result).toEqual({
      Вид: "ЭлементСтиля",
      Значение: "0",
      Размер: 10,
    })
  })

  it("exports project style item refs with Russian metadata root", () => {
    const result = exportFontToYAML(mockContext, mockRule, {
      ref: "TooltipTitleFont",
      kind: "StyleItem",
    })

    expect(result).toEqual({
      Вид: "ЭлементСтиля.TooltipTitleFont",
    })
  })
})
