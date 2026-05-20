import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
}

const fixtureAppearanceFieldsYAMLForImport = {
  ...fixtureAppearanceFieldsYAML,
  Шрифт: {
    Значение: { Вид: "ОченьКрупныйШрифтТекста" },
  },
}

describe("import Appearance from YAML", () => {
  it("should import YAML to metadata", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fixtureAppearanceFieldsYAMLForImport,
    })

    expect(result).toEqual(fixtureAppearanceFields)
  })
})
