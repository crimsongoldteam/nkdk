import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullRadioButtonField, minimalRadioButtonField } from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportRadioButtonFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/radioButtonField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullRadioButtonField })

    const result = xmlExport({ RadioButtonField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/radioButtonField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalRadioButtonField })

    const result = xmlExport({ RadioButtonField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
