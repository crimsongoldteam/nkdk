import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
  yaml: "Оформление",
}

describe("AppearanceFields XML → YAML", () => {
  it("should export minimal appearance", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fixtureAppearanceFields,
      yaml: fixtureAppearanceFieldsYAML,
    })

    expect(result).toEqual({
      Оформление: fixtureAppearanceFieldsYAML,
    })
  })

  it("exports explicit Field value for text appearance", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        Текст: {
          parameter: "Текст",
          value: {
            type: "Field",
            value: "Реквизит1",
          },
        },
      },
      yaml: {
        Текст: {
          Тип: "Поле",
          Значение: "Реквизит1",
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        Текст: {
          Тип: "Поле",
          Значение: "Реквизит1",
        },
      },
    })
  })

  it("exports explicit LocalFormattedStringType value for text appearance", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        Текст: {
          parameter: "Текст",
          value: {
            type: "LocalFormattedStringType",
            value: {
              formatted: true,
              items: { ru: "Многоязычная форматированная строка" },
            },
          },
        },
      },
      yaml: {
        Текст: {
          Тип: "МногоязычнаяФорматированнаяСтрока",
          Значение: {
            Форматированный: "Истина",
            Текст: "Многоязычная форматированная строка",
          },
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        Текст: {
          Тип: "МногоязычнаяФорматированнаяСтрока",
          Значение: {
            Форматированный: "Истина",
            Текст: "Многоязычная форматированная строка",
          },
        },
      },
    })
  })

  it("exports enabled DCS auto color as empty YAML value", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
        },
      },
      yaml: { ЦветТекста: null },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: null,
      },
    })
  })

  it("exports disabled DCS auto color without YAML value", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветФона: {
          parameter: "ЦветФона",
          use: false,
        },
      },
      yaml: { ЦветФона: { Использовать: "Ложь" } },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветФона: {
          Использовать: "Ложь",
        },
      },
    })
  })

  it("exports non-auto color in full SettingsParameterValue form", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
          value: {
            type: "Absolute",
            value: "#FF0000",
          },
        },
      },
      yaml: { ЦветТекста: { Значение: "#FF0000" } },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: {
          Значение: "#FF0000",
        },
      },
    })
  })
})
