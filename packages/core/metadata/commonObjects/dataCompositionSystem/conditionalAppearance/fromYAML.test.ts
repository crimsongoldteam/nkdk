import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromYAML } from "../../../../tests/property/importPropertyFromYAML"
import {
  fullConditionalAppearance,
  fullConditionalAppearanceYAML,
  minimalConditionalAppearanceYAML,
  minimalUserSettingsConditionalAppearanceYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
}

describe("import ConditionalAppearance from YAML", () => {
  it("imports full", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullConditionalAppearanceYAML })
    expect(result).toEqual(fullConditionalAppearance)
  })

  it("imports minimal", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalConditionalAppearanceYAML })
    expect(result).toEqual({
      itemType: "ConditionalAppearance",
    })
  })

  it("imports minimalUserSettings", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalUserSettingsConditionalAppearanceYAML })
    expect(result).toEqual({
      itemType: "ConditionalAppearance",
      userSettingID: "b75fecce-942b-4aed-abc9-e6a02e460fb3",
    })
  })
})
