import { describe, expect, it } from "vitest"
import { fullProgressBarField, minimalProgressBarField } from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportProgressBarFieldToXML } from "./exportToXML"

describe("exportProgressBarFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportProgressBarFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/progressBarField/full.xml")
    const xmlData = exportProgressBarFieldToXML(mockContext, fullProgressBarField)

    const result = xmlExport({ ProgressBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/progressBarField/minimal.xml")
    const xmlData = exportProgressBarFieldToXML(mockContext, minimalProgressBarField)

    const result = xmlExport({ ProgressBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
