import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullFilterItemComparison } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "FilterItem",
}

describe("import FilterItem from XML", () => {
  it("should import full from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullFilterItemComparison)
  })
})
