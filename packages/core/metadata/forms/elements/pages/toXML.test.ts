import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPages, minimalPages } from "~/tests/fixtures/forms/pages/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPagesToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pages/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullPages })

    const result = xmlExport({ Pages: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pages/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalPages })

    const result = xmlExport({ Pages: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
