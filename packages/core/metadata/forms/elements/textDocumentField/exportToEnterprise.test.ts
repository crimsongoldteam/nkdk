import { describe, expect, it } from "vitest"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialEnterprise,
  fullTextDocumentFieldTypedEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportTextDocumentFieldPartialToEnterprise,
  exportTextDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportTextDocumentFieldToEnterprise", () => {
  describe("exportTextDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportTextDocumentFieldPartialToEnterprise(mockСontext, fullTextDocumentField)

      expect(result).toEqual(fullTextDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportTextDocumentFieldPartialToEnterprise(mockСontext, minimalTextDocumentField)

      expect(result).toEqual(minimalTextDocumentFieldPartialEnterprise)
    })
  })

  describe("exportTextDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportTextDocumentFieldTypedToEnterprise(mockСontext, fullTextDocumentField)

      expect(result).toEqual(fullTextDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportTextDocumentFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
