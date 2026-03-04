import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPdfDocumentField, minimalPdfDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPdfDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "PdfDocumentField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PdfDocumentField: ElementXML }>("forms/pdfDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "PdfDocumentField",
      xml: xmlData.PdfDocumentField,
    })

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PdfDocumentField: ElementXML }>("forms/pdfDocumentField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "PdfDocumentField",
      xml: xmlData.PdfDocumentField,
    })

    expect(result).toEqual(minimalPdfDocumentField)
  })
})
