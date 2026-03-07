import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullChartField, minimalChartField } from "~/tests/fixtures/forms/chartField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportChartFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/chartField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullChartField })

    const result = xmlExport({ ChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/chartField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalChartField })

    const result = xmlExport({ ChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
