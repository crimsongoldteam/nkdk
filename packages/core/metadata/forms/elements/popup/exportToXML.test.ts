import { describe, expect, it } from "vitest"
import { fullPopup, minimalPopup } from "~/tests/fixtures/forms/popup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPopupToXML } from "./exportToXML"

describe("exportPopupToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPopupToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/popup/full.xml")
    const xmlData = exportPopupToXML(mockContext, mockRule, fullPopup)

    const result = xmlExport({ Popup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/popup/minimal.xml")
    const xmlData = exportPopupToXML(mockContext, mockRule, minimalPopup)

    const result = xmlExport({ Popup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
