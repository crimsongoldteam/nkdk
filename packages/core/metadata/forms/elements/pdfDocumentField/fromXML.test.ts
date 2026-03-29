import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPDFDocumentField, minimalPDFDocumentField } from "~/metadata/forms/elements/pdfDocumentField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

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
    const xmlData = readAndParseXMLFixture<{ PDFDocumentField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PDFDocumentField",
      xml: xmlData.PDFDocumentField,
    })

    expect(result).toEqual(fullPDFDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ PDFDocumentField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PDFDocumentField",
      xml: xmlData.PDFDocumentField,
    })

    expect(result).toEqual(minimalPDFDocumentField)
  })
})
