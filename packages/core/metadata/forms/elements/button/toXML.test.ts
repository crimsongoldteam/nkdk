import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportButtonToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/button/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullButton })

    const result = xmlExport({ Button: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/button/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalButton })

    const result = xmlExport({ Button: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
