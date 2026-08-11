import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import { serializeDirectXML, testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
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

  it("does not create a container when the YAML key is absent", () => {
    const result = testPropertyFromYAMLToXML({
      rule: {
        itemType: "ConditionalAppearanceContainerProbe",
        properties: {
          value: {
            type: "ConditionalAppearance",
            yaml: "УсловноеОформление",
            xml: "dcsset:conditionalAppearance",
          },
        },
      } as MetadataItemRule,
      yaml: {},
    })

    expect(serializeDirectXML(result.xml)).not.toContain("<dcsset:conditionalAppearance>")
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
