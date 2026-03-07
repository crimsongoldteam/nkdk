import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPopup, minimalPopup } from "~/tests/fixtures/forms/popup/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPopupToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/popup/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullPopup })

    const result = xmlExport({ Popup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/popup/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalPopup })

    const result = xmlExport({ Popup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
