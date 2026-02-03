import { describe, expect, it } from "vitest"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  fullPdfDocumentFieldTypedEnterprise,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  exportPdfDocumentFieldPartialToEnterprise,
  exportPdfDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportPdfDocumentFieldToEnterprise", () => {
  describe("exportPdfDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPdfDocumentFieldPartialToEnterprise(mockContext, mockRule, fullPdfDocumentField)

      expect(result).toEqual(fullPdfDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPdfDocumentFieldPartialToEnterprise(mockContext, mockRule, minimalPdfDocumentField)

      expect(result).toEqual(minimalPdfDocumentFieldPartialEnterprise)
    })
  })

  describe("exportPdfDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPdfDocumentFieldTypedToEnterprise(mockContext, mockRule, fullPdfDocumentField)

      expect(result).toEqual(fullPdfDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportPdfDocumentFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
