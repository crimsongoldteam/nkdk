import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dynamicListGroupItemFieldDefault, dynamicListGroupItemFieldUseFalse } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = { type: "StructureItemGroupCollection" } as const

describe("export GroupItemField to XML", () => {
  it("exports dynamicList.xml (use=false)", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [dynamicListGroupItemFieldUseFalse],
      xmlRootTag: "dcsset:item",
      path: "dynamicList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports dynamicListDefault.xml (use=true)", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [dynamicListGroupItemFieldDefault],
      xmlRootTag: "dcsset:item",
      path: "dynamicListDefault.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
