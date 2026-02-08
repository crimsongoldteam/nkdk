import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  fullSpreadSheetDocumentFieldTypedEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportSpreadSheetDocumentFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullSpreadSheetDocumentField })

      expect(result).toEqual(fullSpreadSheetDocumentFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalSpreadSheetDocumentField })

      expect(result).toEqual(minimalSpreadSheetDocumentFieldPartialEnterprise)
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullSpreadSheetDocumentField })

      expect(result).toEqual(fullSpreadSheetDocumentFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })
  })
})
