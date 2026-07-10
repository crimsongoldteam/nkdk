import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "../../../../../tests/property/exportPropertyToXML"
import { fixtureGroupItemAuto } from "../items/groupItemAuto/__fixtures__/data"
import { dynamicListGroupItemFieldUseFalse } from "../items/groupItemField/__fixtures__/data"
import "./index"

const rule = { type: "StructureItemGroupCollection" } as const

describe("export GroupItem collection to XML", () => {
  it("exports GroupItemAuto", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [fixtureGroupItemAuto],
      xmlRootTag: "dcsset:item",
      path: "../../items/groupItemAuto/__fixtures__/dynamicList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports GroupItemField", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [dynamicListGroupItemFieldUseFalse],
      xmlRootTag: "dcsset:item",
      path: "../../items/groupItemField/__fixtures__/dynamicList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
