import { describe, expect, it } from "vitest"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  fullFormattedDocumentFieldTypedEnterprise,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialEnterprise,
  minimalFormattedDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importFormattedDocumentFieldPartialFromEnterprise,
  importFormattedDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importFormattedDocumentFieldFromEnterprise", () => {
  describe("importFormattedDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importFormattedDocumentFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        undefined,
        "ПолеФорматированногоДокумента"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importFormattedDocumentFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullFormattedDocumentFieldTypedEnterprise,
        "ПолеФорматированногоДокумента"
      )

      expect(result).toEqual(fullFormattedDocumentField)
    })

    it("should import minimal", () => {
      const result = importFormattedDocumentFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalFormattedDocumentFieldTypedEnterprise,
        "ПолеФорматированногоДокумента"
      )

      expect(result).toEqual(minimalFormattedDocumentField)
    })
  })

  describe("importFormattedDocumentFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importFormattedDocumentFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importFormattedDocumentFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullFormattedDocumentField,
        fullFormattedDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullFormattedDocumentField)
    })

    it("should import minimal", () => {
      const result = importFormattedDocumentFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalFormattedDocumentField,
        minimalFormattedDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalFormattedDocumentField)
    })
  })
})
