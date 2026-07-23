import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
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
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fullConditionalAppearance,
      path: "full.xml",
      xmlRootTag: "dcsset:conditionalAppearance",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ УсловноеОформление: fullConditionalAppearanceYAML })
  })

  it("exports minimal", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: minimalConditionalAppearance,
      path: "minimal.xml",
      xmlRootTag: "dcsset:conditionalAppearance",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({})
  })

  it("exports minimalUserSettings", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: minimalUserSettingsConditionalAppearance,
      path: "minimalUserSettings.xml",
      xmlRootTag: "dcsset:conditionalAppearance",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ УсловноеОформление: minimalUserSettingsConditionalAppearanceYAML })
  })
})
