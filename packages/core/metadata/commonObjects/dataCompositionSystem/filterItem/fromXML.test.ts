import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullFilterItemComparison, fullFilterItemGroup } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "FilterItem",
}

describe("import FilterItem from XML", () => {
  it("imports FilterItemComparison from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullFilterItemComparison)
  })

  it("imports FilterItemGroup from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full-group.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullFilterItemGroup)
  })
})
