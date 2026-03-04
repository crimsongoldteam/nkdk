import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPdfDocumentField, fullPdfDocumentFieldEnterprise } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export PDFDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.PDFDocumentField,
      value: fullPdfDocumentField,
    })
    expect(result).toEqual(fullPdfDocumentFieldEnterprise)
  })
})
