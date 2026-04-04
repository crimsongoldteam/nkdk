import { describe, expect, it } from "vitest"
import { fullDynamicList, minimalDynamicList } from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { exportPropertyToXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe.skip("export DynamicList to XML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should export full to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullDynamicList,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  // it("should export customQuery to XML", () => {
  //   const { expectedResult, result } = testExportPropertyToXML({
  //     rule,
  //     value: customQueryDynamicList,
  //     xmlRootTag: "Settings",
  //     path: "customQuery.xml",
  //     importMetaUrl: import.meta.url,
  //   })
  //   expect(result).toEqual(expectedResult)
  // })

  it("should export minimal to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalDynamicList,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(expectedResult)
  })
})
