import { describe, expect, it } from "vitest"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  fullPdfDocumentFieldTypedEnterprise,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportPdfDocumentFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPdfDocumentField })

      expect(result).toEqual(fullPdfDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPdfDocumentField })

      expect(result).toEqual(minimalPdfDocumentFieldPartialEnterprise)
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullPdfDocumentField })

      expect(result).toEqual(fullPdfDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })
  })
})
