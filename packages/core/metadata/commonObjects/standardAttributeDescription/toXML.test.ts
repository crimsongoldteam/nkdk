import { describe, expect, it } from "vitest"
import { all, minimal, multiple } from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

describe("exportStandardAttributeDescriptionsToXML", () => {
  it("exports all.xml fixture", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: all,
      xmlRootTag: "StandardAttributes",
      path: "all.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports multiple.xml fixture", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: ["PredefinedDataName", "Predefined"],
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multiple,
      xmlRootTag: "StandardAttributes",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml fixture", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimal,
      xmlRootTag: "StandardAttributes",
      path: "default.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports undefined", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "StandardAttributes",
      path: "default.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })
    expect(result).toEqual(expectedResult)
  })
})
