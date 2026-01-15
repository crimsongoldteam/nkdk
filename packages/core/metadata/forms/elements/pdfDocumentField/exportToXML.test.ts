import { describe, expect, it } from "vitest"
import { fullPdfDocumentField, minimalPdfDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPdfDocumentFieldToXML } from "./exportToXML"

describe("exportPdfDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPdfDocumentFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pdfDocumentField/full.xml")
    const xmlData = exportPdfDocumentFieldToXML(mockСontext, fullPdfDocumentField)

    const result = xmlExport({ PdfDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pdfDocumentField/minimal.xml")
    const xmlData = exportPdfDocumentFieldToXML(mockСontext, minimalPdfDocumentField)

    const result = xmlExport({ PdfDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
