import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { fullFilterItemComparison, fullFilterItemGroup } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
}

describe("export FilterItem to XML", () => {
  it("exports FilterItemComparison to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [fullFilterItemComparison],
      xmlRootTag: "dcsset:item",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedResult!))
  })

  it("exports FilterItemGroup to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [fullFilterItemGroup],
      xmlRootTag: "dcsset:item",
      path: "full-group.xml",
      importMetaUrl: import.meta.url,
    })

    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedResult!))
  })
})
