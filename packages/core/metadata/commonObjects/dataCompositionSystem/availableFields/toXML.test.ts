import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { fullAvailableFields, selectedItemAvailableFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("export available fields to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullAvailableFields,
      xmlRootTag: "dcsset:selection",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports selected items", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: selectedItemAvailableFields,
      xmlRootTag: "dcsset:selection",
      path: "selected-item.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
