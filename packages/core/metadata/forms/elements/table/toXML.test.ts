import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullTable, minimalTable } from "~/tests/fixtures/forms/table/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportTableToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/table/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullTable })

    const result = xmlExport({ Table: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/table/minimal.xml").trimEnd()
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalTable })

    const result = xmlExport({ Table: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
