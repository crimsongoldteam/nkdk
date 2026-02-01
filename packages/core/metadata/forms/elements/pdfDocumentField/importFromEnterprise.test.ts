import { describe, expect, it } from "vitest"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  fullPdfDocumentFieldTypedEnterprise,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialEnterprise,
  minimalPdfDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importPdfDocumentFieldPartialFromEnterprise,
  importPdfDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importPdfDocumentFieldFromEnterprise", () => {
  describe("importPdfDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPdfDocumentFieldTypedFromEnterprise(mockContext, undefined, "ПолеPDFДокумента")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPdfDocumentFieldTypedFromEnterprise(
        mockContext,
        fullPdfDocumentFieldTypedEnterprise,
        "ПолеPDFДокумента"
      )

      expect(result).toEqual(fullPdfDocumentField)
    })

    it("should import minimal", () => {
      const result = importPdfDocumentFieldTypedFromEnterprise(
        mockContext,
        minimalPdfDocumentFieldTypedEnterprise,
        "ПолеPDFДокумента"
      )

      expect(result).toEqual(minimalPdfDocumentField)
    })
  })

  describe("importPdfDocumentFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPdfDocumentFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPdfDocumentFieldPartialFromEnterprise(
        mockContext,
        fullPdfDocumentField,
        fullPdfDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullPdfDocumentField)
    })

    it("should import minimal", () => {
      const result = importPdfDocumentFieldPartialFromEnterprise(
        mockContext,
        minimalPdfDocumentField,
        minimalPdfDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPdfDocumentField)
    })
  })
})
