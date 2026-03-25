import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullConditionalAppearanceItem, minimalConditionalAppearanceItem } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
}

describe("export ConditionalAppearance to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: [fullConditionalAppearanceItem],
      xmlRootTag: "ConditionalAppearance",
      path: "full.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })

    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedResult!))
  })

  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: [minimalConditionalAppearanceItem],
      xmlRootTag: "ConditionalAppearance",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })

    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedResult!))
  })
})
