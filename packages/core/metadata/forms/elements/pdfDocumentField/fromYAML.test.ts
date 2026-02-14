import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
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
      itemType: FormElementType.PDFDocumentField,
      yaml: fullPdfDocumentFieldPartialEnterprise,
      source: fullPdfDocumentField,
    })

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.PDFDocumentField,
      yaml: minimalPdfDocumentFieldPartialEnterprise,
      source: minimalPdfDocumentField,
    })

    expect(result).toEqual(minimalPdfDocumentField)
  })
})
