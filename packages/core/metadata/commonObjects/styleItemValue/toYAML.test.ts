import { describe, expect, it } from "vitest"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportStyleItemValueToYAML } from "./toYAML"
import { StyleItemValue } from "./types"

const fontValue: StyleItemValue = {
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
}

const colorValue: StyleItemValue = {
  type: "Color",
  value: { type: "Absolute", value: "#8A31E2" },
}

const borderValue: StyleItemValue = {
  type: "Border",
  value: { width: 5, controlBorderType: "Overline" },
}

describe("exportStyleItemValueToYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportStyleItemValueToYAML(mockContextToYAML, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export font style item value to YAML", () => {
    const result = exportStyleItemValueToYAML(mockContextToYAML, mockRule, fontValue)

    expect(result).toEqual({
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
    })
  })

  it("should export color style item value to YAML", () => {
    const result = exportStyleItemValueToYAML(mockContextToYAML, mockRule, colorValue)

    expect(result).toEqual({
      Вид: "Цвет",
      Значение: "#8A31E2",
    })
  })

  it("should export border style item value to YAML", () => {
    const result = exportStyleItemValueToYAML(mockContextToYAML, mockRule, borderValue)

    expect(result).toEqual({
      Вид: "Рамка",
      Значение: {
        Ширина: 5,
        ТипРамки: "ЧертаСверху",
      },
    })
  })
})
