import { describe, expect, it } from "vitest"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { fullMobileDeviceCommandBarContent, twoItemsMobileDeviceCommandBarContent } from "./__fixtures__/data"
import { importMobileDeviceCommandBarContentFromXML } from "./fromXML"
import { MobileDeviceCommandBarContentXML } from "./types"

describe("importMobileDeviceCommandBarContentFromXML", () => {
  it("returns undefined for undefined input", () => {
    const result = importMobileDeviceCommandBarContentFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = importMobileDeviceCommandBarContentFromXML(mockContextFromXML(), mockRule, {})
    expect(result).toBeUndefined()
  })

  it("imports full XML", () => {
    const xml = readAndParseXMLFixture<{ MobileDeviceCommandBarContent: MobileDeviceCommandBarContentXML }>(
      import.meta.url,
      "full.xml"
    )

    const result = importMobileDeviceCommandBarContentFromXML(
      mockContextFromXML(),
      mockRule,
      xml.MobileDeviceCommandBarContent
    )

    expect(result).toEqual(fullMobileDeviceCommandBarContent)
  })

  it("imports two string items XML", () => {
    const xml = readAndParseXMLFixture<{ MobileDeviceCommandBarContent: MobileDeviceCommandBarContentXML }>(
      import.meta.url,
      "twoItems.xml"
    )

    const result = importMobileDeviceCommandBarContentFromXML(
      mockContextFromXML(),
      mockRule,
      xml.MobileDeviceCommandBarContent
    )

    expect(result).toEqual(twoItemsMobileDeviceCommandBarContent)
  })
})
