import { describe, expect, it } from "vitest"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  fullFormattedDocumentFieldTypedEnterprise,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialEnterprise,
  minimalFormattedDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importFormattedDocumentFieldPartialFromEnterprise,
  importFormattedDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importFormattedDocumentFieldFromEnterprise", () => {
  describe("importFormattedDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importFormattedDocumentFieldTypedFromEnterprise(
        mockСontext,
        undefined,
        "ПолеФорматированногоДокумента"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importFormattedDocumentFieldTypedFromEnterprise(
        mockСontext,
        fullFormattedDocumentFieldTypedEnterprise,
        "ПолеФорматированногоДокумента"
      )

      expect(result).toEqual(fullFormattedDocumentField)
    })

    it("should import minimal", () => {
      const result = importFormattedDocumentFieldTypedFromEnterprise(
        mockСontext,
        minimalFormattedDocumentFieldTypedEnterprise,
        "ПолеФорматированногоДокумента"
      )

      expect(result).toEqual(minimalFormattedDocumentField)
    })
  })

  describe("importFormattedDocumentFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importFormattedDocumentFieldPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importFormattedDocumentFieldPartialFromEnterprise(
        mockСontext,
        fullFormattedDocumentField,
        fullFormattedDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullFormattedDocumentField)
    })

    it("should import minimal", () => {
      const result = importFormattedDocumentFieldPartialFromEnterprise(
        mockСontext,
        minimalFormattedDocumentField,
        minimalFormattedDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalFormattedDocumentField)
    })
  })
})
