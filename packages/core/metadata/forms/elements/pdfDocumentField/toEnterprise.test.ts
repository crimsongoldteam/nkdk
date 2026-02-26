import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("export PDFDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.PDFDocumentField,
      value: fullPdfDocumentField,
    })
    expect(result).toEqual(fullPdfDocumentFieldEnterprise)
  })
})
