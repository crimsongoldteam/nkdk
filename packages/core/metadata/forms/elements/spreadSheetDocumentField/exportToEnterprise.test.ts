import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  fullSpreadSheetDocumentFieldTypedEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportSpreadSheetDocumentFieldPartialToEnterprise,
  exportSpreadSheetDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportSpreadSheetDocumentFieldToEnterprise", () => {
  describe("exportSpreadSheetDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSpreadSheetDocumentFieldPartialToEnterprise(mockСontext, fullSpreadSheetDocumentField)

      expect(result).toEqual(fullSpreadSheetDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSpreadSheetDocumentFieldPartialToEnterprise(mockСontext, minimalSpreadSheetDocumentField)

      expect(result).toEqual(minimalSpreadSheetDocumentFieldPartialEnterprise)
    })
  })

  describe("exportSpreadSheetDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSpreadSheetDocumentFieldTypedToEnterprise(mockСontext, fullSpreadSheetDocumentField)

      expect(result).toEqual(fullSpreadSheetDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportSpreadSheetDocumentFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
