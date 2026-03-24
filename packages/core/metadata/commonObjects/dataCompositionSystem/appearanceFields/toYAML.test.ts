import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import { exportAppearanceFieldsToYAML } from "./toYAML"
import { AppearanceFieldsRules } from "./rules"

describe("exportAppearanceFieldsToYAML", () => {
  it("exports full appearance fields YAML", () => {
    const yaml = exportAppearanceFieldsToYAML(mockContext, fixtureAppearanceFields)
    expect(Object.keys(yaml).sort()).toEqual(Object.keys(AppearanceFieldsRules.properties).sort())
    expect(yaml.ЦветФона).toEqual({
      Параметр: "ЦветФона",
      Использовать: "Ложь",
      Значение: "Красный",
    })
  })
})
