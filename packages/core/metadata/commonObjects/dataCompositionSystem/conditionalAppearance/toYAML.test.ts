import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import {
  fullConditionalAppearance,
  fullConditionalAppearanceYAML,
  minimalConditionalAppearance,
  minimalUserSettingsConditionalAppearance,
  minimalUserSettingsConditionalAppearanceYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
  yaml: "УсловноеОформление",
}

describe("export ConditionalAppearance to YAML", () => {
  it("exports full", () => {
    const result = testExportPropertyToYAML({ rule, value: fullConditionalAppearance })
    expect(result).toEqual({ УсловноеОформление: fullConditionalAppearanceYAML })
  })

  it("exports minimal", () => {
    const result = testExportPropertyToYAML({ rule, value: minimalConditionalAppearance })
    expect(result).toBeUndefined()
  })

  it("exports minimalUserSettings", () => {
    const result = testExportPropertyToYAML({ rule, value: minimalUserSettingsConditionalAppearance })
    expect(result).toEqual({ УсловноеОформление: minimalUserSettingsConditionalAppearanceYAML })
  })
})
