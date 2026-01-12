import { describe, expect, it } from "vitest"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  fullFormattedDocumentFieldTypedEnterprise,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportFormattedDocumentFieldPartialToEnterprise,
  exportFormattedDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportFormattedDocumentFieldToEnterprise", () => {
  describe("exportFormattedDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormattedDocumentFieldPartialToEnterprise(mockСontext, fullFormattedDocumentField)

      expect(result).toEqual(fullFormattedDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportFormattedDocumentFieldPartialToEnterprise(mockСontext, minimalFormattedDocumentField)

      expect(result).toEqual(minimalFormattedDocumentFieldPartialEnterprise)
    })
  })

  describe("exportFormattedDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormattedDocumentFieldTypedToEnterprise(mockСontext, fullFormattedDocumentField)

      expect(result).toEqual(fullFormattedDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportFormattedDocumentFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
