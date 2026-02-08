import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullPdfDocumentField, minimalPdfDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPdfDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pdfDocumentField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullPdfDocumentField })

    const result = xmlExport({ PdfDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pdfDocumentField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalPdfDocumentField })

    const result = xmlExport({ PdfDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
