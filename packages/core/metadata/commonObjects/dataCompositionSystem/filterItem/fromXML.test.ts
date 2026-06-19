import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  fullFilterItemComparison,
  fullFilterItemGroup,
  inListFilterItemComparison,
  inListWithNilFilterItemComparison,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
}

describe("import FilterItem from XML", () => {
  it("imports FilterItemComparison from XML", () => {
    const { comparisonType: _xmlDefault, ...expected } = fullFilterItemComparison
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([expected])
  })

  it("imports FilterItemComparison InList (массив rightValue) from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "inList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([inListFilterItemComparison])
  })

  it("imports FilterItemComparison InList with xsi:nil from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "inListWithNil.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([inListWithNilFilterItemComparison])
  })

  it("imports FilterItemGroup from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full-group.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([fullFilterItemGroup])
  })
})
