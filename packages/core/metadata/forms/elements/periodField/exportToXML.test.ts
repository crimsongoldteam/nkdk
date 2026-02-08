import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullPeriodField, minimalPeriodField } from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPeriodFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/periodField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullPeriodField })

    const result = xmlExport({ PeriodField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/periodField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalPeriodField })

    const result = xmlExport({ PeriodField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
