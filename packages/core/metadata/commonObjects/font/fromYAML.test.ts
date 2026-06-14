import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/metadata/commonObjects/font/__fixtures__/data"
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

  it("imports raw non-prefixed ref with Russian font kind", () => {
    const result = importFontFromYAML(mockContext, mockRule, {
      Вид: "ЭлементСтиля",
      Значение: "0",
      Размер: 10,
    } as never)

    expect(result).toEqual({
      ref: "0",
      kind: "StyleItem",
      height: 10,
    })
  })

  it("rejects compact string YAML", () => {
    expect(() => importFontFromYAML(mockContext, mockRule, "ОченьКрупныйШрифтТекста" as never)).toThrow(
      "Font: ожидался объект YAML"
    )
  })

  it("imports project style item refs with Russian metadata root", () => {
    const result = importFontFromYAML(mockContext, mockRule, {
      Вид: "ЭлементСтиля.TooltipTitleFont",
    })

    expect(result).toEqual({
      ref: "TooltipTitleFont",
      kind: "StyleItem",
    })
  })

  it("rejects raw XML style refs from YAML", () => {
    expect(() =>
      importFontFromYAML(mockContext, mockRule, {
        Вид: "style:TooltipTitleFont",
      } as never)
    ).toThrow('Неизвестный корень "style:TooltipTitleFont"')
  })
})
