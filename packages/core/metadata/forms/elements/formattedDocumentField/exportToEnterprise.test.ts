import { describe, expect, it } from "vitest"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  fullFormattedDocumentFieldTypedEnterprise,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import {
  exportFormattedDocumentFieldPartialToEnterprise,
  exportFormattedDocumentFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportFormattedDocumentFieldToEnterprise", () => {
  describe("exportFormattedDocumentFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormattedDocumentFieldPartialToEnterprise(mockContext, fullFormattedDocumentField)

      expect(result).toEqual(fullFormattedDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportFormattedDocumentFieldPartialToEnterprise(mockContext, minimalFormattedDocumentField)

      expect(result).toEqual(minimalFormattedDocumentFieldPartialEnterprise)
    })
  })

  describe("exportFormattedDocumentFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormattedDocumentFieldTypedToEnterprise(mockContext, fullFormattedDocumentField)

      expect(result).toEqual(fullFormattedDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportFormattedDocumentFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
