import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fixtureGroupItemAuto, fixtureGroupItemAutoUseFalse } from "./__fixtures__/data"

describe("export GroupItemAuto to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "GroupItemAuto" },
      value: fixtureGroupItemAuto,
      xmlRootTag: "dcsset:item",
      path: "dynamicList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports fullUseFalse.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "GroupItemAuto" },
      value: fixtureGroupItemAutoUseFalse,
      xmlRootTag: "dcsset:item",
      path: "dynamicListUseFalse.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
