import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPDFDocumentField, minimalPDFDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPDFDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pdfDocumentField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullPDFDocumentField })

    const result = xmlExport({ PDFDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pdfDocumentField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalPDFDocumentField })

    const result = xmlExport({ PDFDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
