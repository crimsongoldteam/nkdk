import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialYAML,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialYAML,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPdfDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PdfDocumentField",
      yaml: fullPdfDocumentFieldPartialYAML,
      source: fullPdfDocumentField,
    })

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PdfDocumentField",
      yaml: minimalPdfDocumentFieldPartialYAML,
      source: minimalPdfDocumentField,
    })

    expect(result).toEqual(minimalPdfDocumentField)
  })
})
