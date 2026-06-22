import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { parameterValueFixtures } from "./__fixtures__/data"
import "./toYAML"

const DEFAULT_YAML_PROPERTY_KEY = "ПараметрНастройки"

describe("exportParameterValueToYAML (через exportPropertyToYAML)", () => {
  it.each(parameterValueFixtures)("exports $title", (fixture) => {
    const yamlKey =
      "yaml" in fixture.rule && typeof fixture.rule.yaml === "string" ? fixture.rule.yaml : DEFAULT_YAML_PROPERTY_KEY

    const rule = {
      ...fixture.rule,
      yaml: yamlKey,
    } as PropertyRule

    const result = testExportPropertyToYAML({
      rule,
      value: fixture.value,
    })

    expect(result).toEqual({
      [yamlKey]: fixture.yaml,
    })
  })

  it("exports explicit empty string value in field context", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule,
      value: {
        parameter: "НоменклатураВключение",
        use: false,
        value: { type: "string", value: "" },
      },
    })

    expect(result).toEqual({
      НоменклатураВключение: {
        Использовать: "Ложь",
        Тип: "Строка",
        Значение: "",
      },
    })
  })

  it("exports value-only SettingsParameterValue in full form", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })

    expect(result).toEqual({
      ЦветТекста: {
        Значение: "#FF0000",
      },
    })
  })

  it("exports disabled SettingsParameterValue in full form", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        parameter: "ЦветТекста",
        use: false,
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })

    expect(result).toEqual({
      ЦветТекста: {
        Использовать: "Ложь",
        Значение: "#FF0000",
      },
    })
  })
})
