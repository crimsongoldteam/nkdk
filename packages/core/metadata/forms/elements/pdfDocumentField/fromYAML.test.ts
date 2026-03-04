import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPdfDocumentField,
  fullPdfDocumentFieldPartialYAML,
  minimalPdfDocumentField,
  minimalPdfDocumentFieldPartialYAML,
} from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPdfDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PdfDocumentField,
      yaml: fullPdfDocumentFieldPartialYAML,
      source: fullPdfDocumentField,
    })

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PdfDocumentField,
      yaml: minimalPdfDocumentFieldPartialYAML,
      source: minimalPdfDocumentField,
    })

    expect(result).toEqual(minimalPdfDocumentField)
  })
})
