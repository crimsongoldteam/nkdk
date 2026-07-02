import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { xmlExport } from "../../../xml/export/exporter"
import { fullMobileDeviceCommandBarContent, twoItemsMobileDeviceCommandBarContent } from "./__fixtures__/data"
import { exportMobileDeviceCommandBarContentToXML } from "./toXML"

describe("exportMobileDeviceCommandBarContentToXML", () => {
  it("returns undefined for undefined input", () => {
    const result = exportMobileDeviceCommandBarContentToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = exportMobileDeviceCommandBarContentToXML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("exports full XML", () => {
    const result = exportMobileDeviceCommandBarContentToXML(mockContext, mockRule, fullMobileDeviceCommandBarContent)
    const xml = xmlExport({ MobileDeviceCommandBarContent: result }, false)

    expect(xml).toEqual(readXMLFixtureAsString(import.meta.url, "full.xml"))
  })

  it("exports two string items XML", () => {
    const result = exportMobileDeviceCommandBarContentToXML(
      mockContext,
      mockRule,
      twoItemsMobileDeviceCommandBarContent
    )
    const xml = xmlExport({ MobileDeviceCommandBarContent: result }, false)

    expect(xml).toEqual(readXMLFixtureAsString(import.meta.url, "twoItems.xml"))
  })
})
