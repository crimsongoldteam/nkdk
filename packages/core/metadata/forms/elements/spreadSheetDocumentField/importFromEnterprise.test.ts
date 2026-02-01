import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  fullSpreadSheetDocumentFieldTypedEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialEnterprise,
  minimalSpreadSheetDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importSpreadSheetDocumentFieldPartialFromEnterprise,
  importSpreadSheetDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importSpreadSheetDocumentFieldFromEnterprise", () => {
  describe("importSpreadSheetDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importSpreadSheetDocumentFieldTypedFromEnterprise(
        mockContext,
        undefined,
        "ПолеТабличногоДокумента"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importSpreadSheetDocumentFieldTypedFromEnterprise(
        mockContext,
        fullSpreadSheetDocumentFieldTypedEnterprise,
        "ПолеТабличногоДокумента"
      )

      expect(result).toEqual(fullSpreadSheetDocumentField)
    })

    it("should import minimal", () => {
      const result = importSpreadSheetDocumentFieldTypedFromEnterprise(
        mockContext,
        minimalSpreadSheetDocumentFieldTypedEnterprise,
        "ПолеТабличногоДокумента"
      )

      expect(result).toEqual(minimalSpreadSheetDocumentField)
    })
  })

  describe("importSpreadSheetDocumentFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importSpreadSheetDocumentFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importSpreadSheetDocumentFieldPartialFromEnterprise(
        mockContext,
        fullSpreadSheetDocumentField,
        fullSpreadSheetDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullSpreadSheetDocumentField)
    })

    it("should import minimal", () => {
      const result = importSpreadSheetDocumentFieldPartialFromEnterprise(
        mockContext,
        minimalSpreadSheetDocumentField,
        minimalSpreadSheetDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalSpreadSheetDocumentField)
    })
  })
})
