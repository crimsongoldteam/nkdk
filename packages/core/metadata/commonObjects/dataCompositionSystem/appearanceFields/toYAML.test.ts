import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
  yaml: "Оформление",
}

describe("export Appearance to YAML", () => {
  it("should export minimal appearance", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fixtureAppearanceFields,
    })

    expect(result).toEqual({
      Оформление: fixtureAppearanceFieldsYAML,
    })
  })

  it("exports enabled DCS auto color as empty YAML value", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: null,
      },
    })
  })

  it("exports disabled DCS auto color without YAML value", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветФона: {
          parameter: "ЦветФона",
          use: false,
        },
      },
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
    const result = testExportPropertyToYAML({
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
