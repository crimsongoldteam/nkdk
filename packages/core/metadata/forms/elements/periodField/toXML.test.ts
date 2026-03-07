import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPeriodField, minimalPeriodField } from "~/tests/fixtures/forms/periodField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPeriodFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/periodField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullPeriodField })

    const result = xmlExport({ PeriodField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/periodField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalPeriodField })

    const result = xmlExport({ PeriodField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
