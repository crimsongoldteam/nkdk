import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importStyleItemValueFromYAML } from "./fromYAML"
import { StyleItemValueYAML } from "./types"

const fontYAML: StyleItemValueYAML = {
  Вид: "Шрифт",
  Значение: {
    Имя: "Devanagari MT",
    Размер: 16,
    Полужирный: "Истина",
    Наклонный: "Истина",
    Подчеркивание: "Истина",
    Зачеркивание: "Истина",
    Масштаб: 99,
  },
}

const colorYAML: StyleItemValueYAML = {
  Вид: "Цвет",
  Значение: "#8A31E2",
}

const borderYAML: StyleItemValueYAML = {
  Вид: "Рамка",
  Значение: {
    Ширина: 5,
    ТипРамки: "ЧертаСверху",
  },
}

describe("importStyleItemValueFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importStyleItemValueFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import font style item value from YAML", () => {
    const result = importStyleItemValueFromYAML(mockContext, mockRule, fontYAML)

    expect(result).toEqual({
      type: "Font",
      value: {
        faceName: "Devanagari MT",
        height: 16,
        bold: true,
        italic: true,
        underline: true,
        strikeout: true,
        kind: "Absolute",
        scale: 99,
      },
    })
  })

  it("should import color style item value from YAML", () => {
    const result = importStyleItemValueFromYAML(mockContext, mockRule, colorYAML)

    expect(result).toEqual({
      type: "Color",
      value: { type: "Absolute", value: "#8A31E2" },
    })
  })

  it("should import border style item value from YAML", () => {
    const result = importStyleItemValueFromYAML(mockContext, mockRule, borderYAML)

    expect(result).toEqual({
      type: "Border",
      value: { width: 5, controlBorderType: "Overline" },
    })
  })
})
