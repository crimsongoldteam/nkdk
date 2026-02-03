import { describe, expect, it } from "vitest"
import { fullChartField, minimalChartField } from "~/tests/fixtures/forms/chartField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChartFieldToXML } from "./exportToXML"

describe("exportChartFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportChartFieldToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/chartField/full.xml")
    const xmlData = exportChartFieldToXML(mockContext, mockRule, fullChartField)

    const result = xmlExport({ ChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/chartField/minimal.xml")
    const xmlData = exportChartFieldToXML(mockContext, mockRule, minimalChartField)

    const result = xmlExport({ ChartField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
