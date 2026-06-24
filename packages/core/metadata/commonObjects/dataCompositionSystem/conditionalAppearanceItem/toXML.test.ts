import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullConditionalAppearanceItems, minimalConditionalAppearanceItems } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
}

describe("export ConditionalAppearanceItems to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullConditionalAppearanceItems,
      xmlRootTag: "ConditionalAppearance",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalConditionalAppearanceItems,
      xmlRootTag: "ConditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
