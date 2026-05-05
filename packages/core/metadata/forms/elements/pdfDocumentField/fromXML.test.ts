import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPDFDocumentField, minimalPDFDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPDFDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PDFDocumentField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PDFDocumentField: ElementXML }>("forms/pdfDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PDFDocumentField",
      xml: xmlData.PDFDocumentField,
    })

    expect(result).toEqual(fullPDFDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PDFDocumentField: ElementXML }>("forms/pdfDocumentField/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PDFDocumentField",
      xml: xmlData.PDFDocumentField,
    })

    expect(result).toEqual(minimalPDFDocumentField)
  })
})
