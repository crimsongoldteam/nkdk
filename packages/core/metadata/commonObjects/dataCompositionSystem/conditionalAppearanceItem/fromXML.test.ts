import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullConditionalAppearanceItems, minimalConditionalAppearanceItems } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
}

describe("import ConditionalAppearanceItems from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "ConditionalAppearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullConditionalAppearanceItems)
  })

  it("imports minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "ConditionalAppearance",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(minimalConditionalAppearanceItems)
  })
})
