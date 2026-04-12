import { describe, expect, it } from "vitest"
import {
  customQueryDynamicList,
  fullDynamicList,
  minimalDynamicList,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe.skip("import DynamicList from XML", () => {
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

  it("should import customQuery", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "customQuery.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(customQueryDynamicList)
  })
})
