import { describe, expect, it } from "vitest"
import { fullChartField, minimalChartField } from "~/tests/fixtures/forms/chartField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChartFieldToXML } from "./exportToXML"

describe("exportChartFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportChartFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/chartField/full.xml")
    const xmlData = exportChartFieldToXML(mockСontext, fullChartField)

    const result = xmlExport({ ChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/chartField/minimal.xml")
    const xmlData = exportChartFieldToXML(mockСontext, minimalChartField)

    const result = xmlExport({ ChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

