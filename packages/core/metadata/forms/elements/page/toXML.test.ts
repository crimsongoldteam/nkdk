import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPage, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPageToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/page/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullPage })

    const result = xmlExport({ Page: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/page/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalPage })

    const result = xmlExport({ Page: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
