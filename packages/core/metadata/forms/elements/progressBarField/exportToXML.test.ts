import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullProgressBarField, minimalProgressBarField } from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportProgressBarFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/progressBarField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullProgressBarField })

    const result = xmlExport({ ProgressBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/progressBarField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalProgressBarField })

    const result = xmlExport({ ProgressBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
