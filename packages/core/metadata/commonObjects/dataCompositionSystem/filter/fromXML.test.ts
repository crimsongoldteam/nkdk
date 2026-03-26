import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullFilterFromXML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
}

describe("import Filter from XML", () => {
  it("imports full from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:filter",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullFilterFromXML)
  })
})
