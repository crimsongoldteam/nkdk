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
})
