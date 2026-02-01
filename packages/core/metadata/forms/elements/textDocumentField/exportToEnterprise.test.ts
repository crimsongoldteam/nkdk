import { describe, expect, it } from "vitest"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialEnterprise,
  fullTextDocumentFieldTypedEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import {
  exportTextDocumentFieldPartialToEnterprise,
  exportTextDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportTextDocumentFieldToEnterprise", () => {
  describe("exportTextDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportTextDocumentFieldPartialToEnterprise(mockContext, fullTextDocumentField)

      expect(result).toEqual(fullTextDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportTextDocumentFieldPartialToEnterprise(mockContext, minimalTextDocumentField)

      expect(result).toEqual(minimalTextDocumentFieldPartialEnterprise)
    })
  })

  describe("exportTextDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportTextDocumentFieldTypedToEnterprise(mockContext, fullTextDocumentField)

      expect(result).toEqual(fullTextDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportTextDocumentFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
