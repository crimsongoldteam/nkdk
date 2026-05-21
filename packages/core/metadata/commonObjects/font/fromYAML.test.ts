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
})
