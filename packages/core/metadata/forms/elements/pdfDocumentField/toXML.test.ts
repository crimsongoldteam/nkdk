import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullPDFDocumentField, minimalPDFDocumentField } from "~/tests/fixtures/forms/pdfDocumentField/data"

describe("exportPDFDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPDFDocumentField,
      path: "forms/pdfDocumentField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPDFDocumentField,
      path: "forms/pdfDocumentField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
