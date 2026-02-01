import { describe, expect, it } from "vitest"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialEnterprise,
  fullHtmlDocumentFieldTypedEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldPartialEnterprise,
  minimalHtmlDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importHTMLDocumentFieldPartialFromEnterprise,
  importHTMLDocumentFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importHTMLDocumentFieldFromEnterprise", () => {
  describe("importHTMLDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importHTMLDocumentFieldTypedFromEnterprise(mockContext, undefined, "ПолеHTMLДокумента")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importHTMLDocumentFieldTypedFromEnterprise(
        mockContext,
        fullHtmlDocumentFieldTypedEnterprise,
        "ПолеHTMLДокумента"
      )

      expect(result).toEqual(fullHtmlDocumentField)
    })

    it("should import minimal", () => {
      const result = importHTMLDocumentFieldTypedFromEnterprise(
        mockContext,
        minimalHtmlDocumentFieldTypedEnterprise,
        "ПолеHTMLДокумента"
      )

      expect(result).toEqual(minimalHtmlDocumentField)
    })
  })

  describe("importHTMLDocumentFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importHTMLDocumentFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importHTMLDocumentFieldPartialFromEnterprise(
        mockContext,
        fullHtmlDocumentField,
        fullHtmlDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(fullHtmlDocumentField)
    })

    it("should import minimal", () => {
      const result = importHTMLDocumentFieldPartialFromEnterprise(
        mockContext,
        minimalHtmlDocumentField,
        minimalHtmlDocumentFieldPartialEnterprise
      )

      expect(result).toEqual(minimalHtmlDocumentField)
    })
  })
})
