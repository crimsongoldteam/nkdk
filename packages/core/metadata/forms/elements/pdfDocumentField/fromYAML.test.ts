import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialEnterprise,
  fullPdfDocumentFieldTypedEnterprise,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialEnterprise,
  minimalPdfDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { PdfDocumentField } from "./types"

describe("importPdfDocumentFieldFromEnterprise", () => {
  describe("importPdfDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<PdfDocumentField>({
        context: mockContext,
        data: undefined,
        name: "ПолеPDFДокумента",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<PdfDocumentField>({
        context: mockContext,
        data: fullPdfDocumentFieldTypedEnterprise,
        name: "ПолеPDFДокумента",
      })

      expect(result).toEqual(fullPdfDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<PdfDocumentField>({
        context: mockContext,
        data: minimalPdfDocumentFieldTypedEnterprise,
        name: "ПолеPDFДокумента",
      })

      expect(result).toEqual(minimalPdfDocumentField)
    })
  })

  describe("importPdfDocumentFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PDFDocumentField,
        data: fullPdfDocumentFieldPartialEnterprise,
        source: fullPdfDocumentField,
      })

      expect(result).toEqual(fullPdfDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PDFDocumentField,
        data: minimalPdfDocumentFieldPartialEnterprise,
        source: minimalPdfDocumentField,
      })

      expect(result).toEqual(minimalPdfDocumentField)
    })
  })
})
