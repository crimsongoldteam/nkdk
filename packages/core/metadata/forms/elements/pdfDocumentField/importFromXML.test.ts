import { describe, expect, it } from "vitest"
import { fullPdfDocumentField, minimalPdfDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPdfDocumentFieldFromXML } from "./importFromXML"
import { PdfDocumentFieldXML } from "./types"

describe("importPdfDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPdfDocumentFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PdfDocumentField: PdfDocumentFieldXML }>("forms/pdfDocumentField/full.xml")

    const result = importPdfDocumentFieldFromXML(mockСontext, xmlData.PdfDocumentField)

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PdfDocumentField: PdfDocumentFieldXML }>("forms/pdfDocumentField/minimal.xml")

    const result = importPdfDocumentFieldFromXML(mockСontext, xmlData.PdfDocumentField)

    expect(result).toEqual(minimalPdfDocumentField)
  })
})

