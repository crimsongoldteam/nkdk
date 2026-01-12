import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  fullSpreadSheetDocumentFieldTypedEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialEnterprise,
  minimalSpreadSheetDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importSpreadSheetDocumentFieldPartialFromEnterprise,
  importSpreadSheetDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importSpreadSheetDocumentFieldFromEnterprise", () => {
  describe("importSpreadSheetDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importSpreadSheetDocumentFieldTypedFromEnterprise(
        mockСontext,
        undefined,
        "ПолеТабличногоДокумента"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importSpreadSheetDocumentFieldTypedFromEnterprise(
        mockСontext,
        fullSpreadSheetDocumentFieldTypedEnterprise,
        "ПолеТабличногоДокумента"
      )

      expect(result).toEqual(fullSpreadSheetDocumentField)
    })

    it("should import minimal", () => {
      const result = importSpreadSheetDocumentFieldTypedFromEnterprise(
        mockСontext,
        minimalSpreadSheetDocumentFieldTypedEnterprise,
        "ПолеТабличногоДокумента"
      )

      expect(result).toEqual(minimalSpreadSheetDocumentField)
    })
  })

  describe("importSpreadSheetDocumentFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importSpreadSheetDocumentFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importSpreadSheetDocumentFieldPartialFromEnterprise(
        mockСontext,
        fullSpreadSheetDocumentField,
        fullSpreadSheetDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullSpreadSheetDocumentField)
    })

    it("should import minimal", () => {
      const result = importSpreadSheetDocumentFieldPartialFromEnterprise(
        mockСontext,
        minimalSpreadSheetDocumentField,
        minimalSpreadSheetDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalSpreadSheetDocumentField)
    })
  })
})
