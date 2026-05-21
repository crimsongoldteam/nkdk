import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { parameterValueFixtures } from "./__fixtures__/data"
import "./fromYAML"

describe("importParameterValueFromYAML (через importPropertyFromYAML)", () => {
  it.each(parameterValueFixtures)("imports $title", (fixture) => {
    const result = testImportPropertyFromYAML({
      rule: fixture.rule as PropertyRule,
      value: fixture.yaml,
    })
    expect(result).toEqual(fixture.value)
  })

  it("imports wrapper whose name matches a Font YAML key for non-Font values", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue" } as PropertyRule,
      value: {
        Имя: "Значение",
      },
    })

    expect(result).toEqual({
      parameter: "Имя",
      value: { items: { ru: "Значение" } },
    })
  })

  it("imports expanded use-only SettingsParameterValue without treating it as value", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
      value: {
        Использовать: "Ложь",
      },
    })

    expect(result).toEqual({
      parameter: "Текст",
      use: false,
    })
  })
})
