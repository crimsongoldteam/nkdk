import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import type { AppearanceFieldsYAML } from "./types"
import { fixtureAppearanceFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "Appearance",
}

const fixtureAppearanceFieldsYAML: AppearanceFieldsYAML = {
  ЦветФона: {
    Параметр: "ЦветФона",
    Использовать: "Ложь",
    Значение: "Красный",
  },
}

describe("import Appearance from YAML", () => {
  it("should import YAML to metadata", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fixtureAppearanceFieldsYAML,
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветФона: fixtureAppearanceFields.ЦветФона,
    })
  })
})
