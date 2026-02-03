import { describe, expect, it } from "vitest"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialEnterprise,
  fullTextDocumentFieldTypedEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldPartialEnterprise,
  minimalTextDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importTextDocumentFieldPartialFromEnterprise,
  importTextDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importTextDocumentFieldFromEnterprise", () => {
  describe("importTextDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importTextDocumentFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        undefined,
        "ПолеТекстовогоДокумента"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importTextDocumentFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullTextDocumentFieldTypedEnterprise,
        "ПолеТекстовогоДокумента"
      )

      expect(result).toEqual(fullTextDocumentField)
    })

    it("should import minimal", () => {
      const result = importTextDocumentFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalTextDocumentFieldTypedEnterprise,
        "ПолеТекстовогоДокумента"
      )

      expect(result).toEqual(minimalTextDocumentField)
    })
  })

  describe("importTextDocumentFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importTextDocumentFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importTextDocumentFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullTextDocumentField,
        fullTextDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullTextDocumentField)
    })

    it("should import minimal", () => {
      const result = importTextDocumentFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalTextDocumentField,
        minimalTextDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalTextDocumentField)
    })
  })
})
