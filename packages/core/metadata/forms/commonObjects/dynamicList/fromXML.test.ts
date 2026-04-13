import { describe, expect, it } from "vitest"
import {
  fullDynamicList,
  minimalDynamicList,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe("import DynamicList from XML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fullDynamicList)
  })

  it("should import minimal", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(minimalDynamicList)
  })

  it("round-trip: full.xml import → export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("round-trip: minimal.xml import → export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("round-trip: customQuery.xml import → export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "customQuery.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "customQuery.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
})
