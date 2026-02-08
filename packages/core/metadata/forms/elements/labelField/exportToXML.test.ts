import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullLabelField, minimalLabelField } from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportLabelFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/labelField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullLabelField })

    const result = xmlExport({ LabelField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/labelField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalLabelField })

    const result = xmlExport({ LabelField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
