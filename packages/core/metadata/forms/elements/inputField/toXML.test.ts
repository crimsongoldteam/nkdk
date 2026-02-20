import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullInputField, minimalInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportInputFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/inputField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullInputField })

    const result = xmlExport({ InputField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/inputField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalInputField })

    const result = xmlExport({ InputField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
