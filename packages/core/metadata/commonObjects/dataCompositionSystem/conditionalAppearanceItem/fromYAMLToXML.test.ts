import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  fullConditionalAppearanceItems,
  minimalConditionalAppearanceItems,
  fullConditionalAppearanceItemsYAML,
  minimalConditionalAppearanceItemsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
}

describe("export ConditionalAppearanceItems to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: fullConditionalAppearanceItems,
      yaml: fullConditionalAppearanceItemsYAML,
      xmlRootTag: "ConditionalAppearance",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: minimalConditionalAppearanceItems,
      yaml: minimalConditionalAppearanceItemsYAML,
      xmlRootTag: "ConditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
