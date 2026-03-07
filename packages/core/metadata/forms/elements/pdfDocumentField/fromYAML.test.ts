import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullPDFDocumentField,
  fullPDFDocumentFieldPartialYAML,
  minimalPDFDocumentField,
  minimalPDFDocumentFieldPartialYAML,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPDFDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PDFDocumentField",
      yaml: fullPDFDocumentFieldPartialYAML,
      source: fullPDFDocumentField,
    })

    expect(result).toEqual(fullPDFDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PDFDocumentField",
      yaml: minimalPDFDocumentFieldPartialYAML,
      source: minimalPDFDocumentField,
    })

    expect(result).toEqual(minimalPDFDocumentField)
  })
})
