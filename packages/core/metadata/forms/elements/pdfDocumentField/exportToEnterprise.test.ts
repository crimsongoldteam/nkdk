import { describe, expect, it } from "vitest"
import { fullPdfDocumentField, fullPdfDocumentFieldEnterprise, minimalPdfDocumentField, minimalPdfDocumentFieldEnterprise } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPdfDocumentFieldToEnterprise } from "./exportToEnterprise"

describe("exportPdfDocumentFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPdfDocumentFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPdfDocumentFieldToEnterprise(mockСontext, fullPdfDocumentField)

    expect(result).toEqual(fullPdfDocumentFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPdfDocumentFieldToEnterprise(mockСontext, minimalPdfDocumentField)

    expect(result).toEqual(minimalPdfDocumentFieldEnterprise)
  })
})

