import { describe, expect, it } from "vitest"
import { fullGanttChartField, minimalGanttChartField } from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportGanttChartFieldToXML } from "./exportToXML"

describe("exportGanttChartFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportGanttChartFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/ganttChartField/full.xml")

    const xmlData = exportGanttChartFieldToXML(mockContext, fullGanttChartField)

    const result = xmlExport({ GanttChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/ganttChartField/minimal.xml")
    const xmlData = exportGanttChartFieldToXML(mockContext, minimalGanttChartField)

    const result = xmlExport({ GanttChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
