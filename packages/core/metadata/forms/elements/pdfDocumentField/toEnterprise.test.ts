import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPDFDocumentField, fullPDFDocumentFieldEnterprise } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export PDFDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPDFDocumentField,
    })
    expect(result).toEqual(fullPDFDocumentFieldEnterprise)
  })
})
