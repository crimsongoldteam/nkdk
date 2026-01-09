import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { importSpreadSheetDocumentFieldFromEnterprise } from "./importFromEnterprise"

describe("importSpreadSheetDocumentFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importSpreadSheetDocumentFieldFromEnterprise(mockСontext, undefined, fullSpreadSheetDocumentField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importSpreadSheetDocumentFieldFromEnterprise(
      mockСontext,
      fullSpreadSheetDocumentFieldEnterprise,
      fullSpreadSheetDocumentField.name
    )

    expect(result).toEqual(fullSpreadSheetDocumentField)
  })

  it("should import minimal", () => {
    const result = importSpreadSheetDocumentFieldFromEnterprise(
      mockСontext,
      minimalSpreadSheetDocumentFieldEnterprise,
      minimalSpreadSheetDocumentField.name
    )

    expect(result).toEqual(minimalSpreadSheetDocumentField)
  })
})

