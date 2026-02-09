import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  minimalPdfDocumentField,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPdfDocumentFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPdfDocumentField })

      expect(result).toEqual(fullPdfDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPdfDocumentField })

      expect(result).toBeUndefined()
    })
  })
})
