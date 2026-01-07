import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportSpreadSheetDocumentFieldToEnterprise } from "./exportToEnterprise"

describe("exportSpreadSheetDocumentFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportSpreadSheetDocumentFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportSpreadSheetDocumentFieldToEnterprise(mockСontext, fullSpreadSheetDocumentField)

    expect(result).toEqual(fullSpreadSheetDocumentFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportSpreadSheetDocumentFieldToEnterprise(mockСontext, minimalSpreadSheetDocumentField)

    expect(result).toEqual(minimalSpreadSheetDocumentFieldEnterprise)
  })
})

