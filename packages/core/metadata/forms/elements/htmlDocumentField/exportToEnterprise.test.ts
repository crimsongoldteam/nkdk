import { describe, expect, it } from "vitest"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialEnterprise,
  fullHtmlDocumentFieldTypedEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportHTMLDocumentFieldPartialToEnterprise,
  exportHTMLDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportHTMLDocumentFieldToEnterprise", () => {
  describe("exportHTMLDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportHTMLDocumentFieldPartialToEnterprise(mockСontext, fullHtmlDocumentField)

      expect(result).toEqual(fullHtmlDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportHTMLDocumentFieldPartialToEnterprise(mockСontext, minimalHtmlDocumentField)

      expect(result).toEqual(minimalHtmlDocumentFieldPartialEnterprise)
    })
  })

  describe("exportHTMLDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportHTMLDocumentFieldTypedToEnterprise(mockСontext, fullHtmlDocumentField)

      expect(result).toEqual(fullHtmlDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportHTMLDocumentFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
