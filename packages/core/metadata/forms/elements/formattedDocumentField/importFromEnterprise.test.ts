import { describe, expect, it } from "vitest"
import { fullFormattedDocumentField, fullFormattedDocumentFieldEnterprise, minimalFormattedDocumentField, minimalFormattedDocumentFieldEnterprise } from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormattedDocumentFieldFromEnterprise } from "./importFromEnterprise"

describe("importFormattedDocumentFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormattedDocumentFieldFromEnterprise(mockСontext, undefined, fullFormattedDocumentField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importFormattedDocumentFieldFromEnterprise(mockСontext, fullFormattedDocumentFieldEnterprise, fullFormattedDocumentField.name)
    result!.id = "1"

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const result = importFormattedDocumentFieldFromEnterprise(mockСontext, minimalFormattedDocumentFieldEnterprise, minimalFormattedDocumentField.name)
    result!.id = "1"

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})

