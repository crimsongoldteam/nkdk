import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullTextDocumentField, minimalTextDocumentField } from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportTextDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/textDocumentField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullTextDocumentField })

    const result = xmlExport({ TextDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/textDocumentField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalTextDocumentField })

    const result = xmlExport({ TextDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
