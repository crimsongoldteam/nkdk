import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPdfDocumentFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.PDFDocumentField,
      data: fullPdfDocumentFieldPartialEnterprise,
      source: fullPdfDocumentField,
    })

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.PDFDocumentField,
      data: minimalPdfDocumentFieldPartialEnterprise,
      source: minimalPdfDocumentField,
    })

    expect(result).toEqual(minimalPdfDocumentField)
  })
})
