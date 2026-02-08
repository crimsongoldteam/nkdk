import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullGanttChartField, minimalGanttChartField } from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportGanttChartFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/ganttChartField/full.xml")

    const xmlData = exportElementToXML({ context: mockContext, element: fullGanttChartField })

    const result = xmlExport({ GanttChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/ganttChartField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalGanttChartField })

    const result = xmlExport({ GanttChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
