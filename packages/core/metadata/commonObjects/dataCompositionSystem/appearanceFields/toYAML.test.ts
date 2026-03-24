import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fixtureAppearanceFieldsMinimal, fixtureAppearanceFieldsMinimalYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "Appearance",
  yaml: "Оформление",
}

describe("export Appearance to YAML", () => {
  it("should export minimal appearance", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fixtureAppearanceFieldsMinimal,
    })

    expect(result).toEqual({
      Оформление: fixtureAppearanceFieldsMinimalYAML,
    })
  })
})
