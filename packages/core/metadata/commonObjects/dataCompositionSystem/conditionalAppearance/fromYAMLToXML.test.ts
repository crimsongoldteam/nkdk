import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  fullConditionalAppearance,
  minimalConditionalAppearance,
  minimalUserSettingsConditionalAppearance,
  fullConditionalAppearanceYAML,
  minimalConditionalAppearanceYAML,
  minimalUserSettingsConditionalAppearanceYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
}

describe("export ConditionalAppearance to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: fullConditionalAppearance,
      yaml: fullConditionalAppearanceYAML,
      xmlRootTag: "dcsset:conditionalAppearance",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: minimalConditionalAppearance,
      yaml: minimalConditionalAppearanceYAML,
      xmlRootTag: "dcsset:conditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimalUserSettings.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: minimalUserSettingsConditionalAppearance,
      yaml: minimalUserSettingsConditionalAppearanceYAML,
      xmlRootTag: "dcsset:conditionalAppearance",
      path: "minimalUserSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
