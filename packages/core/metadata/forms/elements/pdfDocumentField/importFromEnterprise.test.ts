import { describe, expect, it } from "vitest"
import { fullPdfDocumentField, fullPdfDocumentFieldEnterprise, minimalPdfDocumentField, minimalPdfDocumentFieldEnterprise } from "~/tests/fixtures/forms/pdfDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { importPdfDocumentFieldFromEnterprise } from "./importFromEnterprise"

describe("importPdfDocumentFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPdfDocumentFieldFromEnterprise(mockСontext, undefined, fullPdfDocumentField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPdfDocumentFieldFromEnterprise(mockСontext, fullPdfDocumentFieldEnterprise, fullPdfDocumentField.name)
    result!.id = "1"

    expect(result).toEqual(fullPdfDocumentField)
  })

  it("should import minimal", () => {
    const result = importPdfDocumentFieldFromEnterprise(mockСontext, minimalPdfDocumentFieldEnterprise, minimalPdfDocumentField.name)
    result!.id = "1"

    expect(result).toEqual(minimalPdfDocumentField)
  })
})

