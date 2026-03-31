import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fixtureDynamicListStructureItemGroup } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "StructureItemGroup",
}

describe("export StructureItemGroup to XML", () => {
  it("exports dynamicList.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: fixtureDynamicListStructureItemGroup,
      xmlRootTag: "dcsset:item",
      path: "dynamicList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult!)
  })
})
