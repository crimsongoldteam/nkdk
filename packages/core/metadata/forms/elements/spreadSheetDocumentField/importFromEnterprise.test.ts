import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  fullSpreadSheetDocumentFieldTypedEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialEnterprise,
  minimalSpreadSheetDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { SpreadSheetDocumentField } from "./types"

describe("importSpreadSheetDocumentFieldFromEnterprise", () => {
  describe("importSpreadSheetDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<SpreadSheetDocumentField>({
        context: mockContext,
        data: undefined,
        name: "ПолеТабличногоДокумента",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<SpreadSheetDocumentField>({
        context: mockContext,
        data: fullSpreadSheetDocumentFieldTypedEnterprise,
        name: "ПолеТабличногоДокумента",
      })

      expect(result).toEqual(fullSpreadSheetDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<SpreadSheetDocumentField>({
        context: mockContext,
        data: minimalSpreadSheetDocumentFieldTypedEnterprise,
        name: "ПолеТабличногоДокумента",
      })

      expect(result).toEqual(minimalSpreadSheetDocumentField)
    })
  })

  describe("importSpreadSheetDocumentFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.SpreadSheetDocumentField,
        data: fullSpreadSheetDocumentFieldPartialEnterprise,
        source: fullSpreadSheetDocumentField,
      })

      expect(result).toEqual(fullSpreadSheetDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.SpreadSheetDocumentField,
        data: minimalSpreadSheetDocumentFieldPartialEnterprise,
        source: minimalSpreadSheetDocumentField,
      })

      expect(result).toEqual(minimalSpreadSheetDocumentField)
    })
  })
})
