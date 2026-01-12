import { describe, expect, it } from "vitest"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  fullPdfDocumentFieldTypedEnterprise,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialEnterprise,
  minimalPdfDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportPdfDocumentFieldPartialToEnterprise,
  exportPdfDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportPdfDocumentFieldToEnterprise", () => {
  describe("exportPdfDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPdfDocumentFieldPartialToEnterprise(mockСontext, fullPdfDocumentField)

      expect(result).toEqual(fullPdfDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPdfDocumentFieldPartialToEnterprise(mockСontext, minimalPdfDocumentField)

      expect(result).toEqual(minimalPdfDocumentFieldPartialEnterprise)
    })
  })

  describe("exportPdfDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPdfDocumentFieldTypedToEnterprise(mockСontext, fullPdfDocumentField)

      expect(result).toEqual(fullPdfDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportPdfDocumentFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
