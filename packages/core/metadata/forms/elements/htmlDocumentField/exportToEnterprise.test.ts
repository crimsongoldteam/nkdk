import { describe, expect, it } from "vitest"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialEnterprise,
  fullHtmlDocumentFieldTypedEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import {
  exportHTMLDocumentFieldPartialToEnterprise,
  exportHTMLDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportHTMLDocumentFieldToEnterprise", () => {
  describe("exportHTMLDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportHTMLDocumentFieldPartialToEnterprise(mockContext, fullHtmlDocumentField)

      expect(result).toEqual(fullHtmlDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportHTMLDocumentFieldPartialToEnterprise(mockContext, minimalHtmlDocumentField)

      expect(result).toEqual(minimalHtmlDocumentFieldPartialEnterprise)
    })
  })

  describe("exportHTMLDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportHTMLDocumentFieldTypedToEnterprise(mockContext, fullHtmlDocumentField)

      expect(result).toEqual(fullHtmlDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportHTMLDocumentFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
