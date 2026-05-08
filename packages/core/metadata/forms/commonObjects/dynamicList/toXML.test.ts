import { describe, expect, it } from "vitest"
import {
  emptyListSettingsDynamicList,
  fullDynamicList,
  minimalDynamicList,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { exportPropertyToXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe("export DynamicList to XML", () => {
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

  it("should export minimal to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalDynamicList,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export empty ListSettings", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: emptyListSettingsDynamicList,
      path: "emptyListSettings.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
