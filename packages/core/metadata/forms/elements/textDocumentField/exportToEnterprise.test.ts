import { describe, expect, it } from "vitest"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialEnterprise,
  fullTextDocumentFieldTypedEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportTextDocumentFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullTextDocumentField })

      expect(result).toEqual(fullTextDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalTextDocumentField })

      expect(result).toEqual(minimalTextDocumentFieldPartialEnterprise)
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullTextDocumentField })

      expect(result).toEqual(fullTextDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })
  })
})
