import { describe, expect, it } from "vitest"
import { fullFormattedDocumentField, fullFormattedDocumentFieldEnterprise, minimalFormattedDocumentField, minimalFormattedDocumentFieldEnterprise } from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormattedDocumentFieldToEnterprise } from "./exportToEnterprise"

describe("exportFormattedDocumentFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormattedDocumentFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportFormattedDocumentFieldToEnterprise(mockСontext, fullFormattedDocumentField)

    expect(result).toEqual(fullFormattedDocumentFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportFormattedDocumentFieldToEnterprise(mockСontext, minimalFormattedDocumentField)

    expect(result).toEqual(minimalFormattedDocumentFieldEnterprise)
  })
})

