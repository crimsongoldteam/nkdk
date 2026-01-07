import { describe, expect, it } from "vitest"
import { fullPeriodField, minimalPeriodField } from "~/tests/fixtures/forms/periodField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPeriodFieldToXML } from "./exportToXML"

describe("exportPeriodFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPeriodFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/periodField/full.xml")
    const xmlData = exportPeriodFieldToXML(mockСontext, fullPeriodField)

    const result = xmlExport({ PeriodField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/periodField/minimal.xml")
    const xmlData = exportPeriodFieldToXML(mockСontext, minimalPeriodField)

    const result = xmlExport({ PeriodField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
