import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  fullFormattedDocumentFieldTypedEnterprise,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialEnterprise,
  minimalFormattedDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { FormattedDocumentField } from "./types"

describe("importFormattedDocumentFieldFromEnterprise", () => {
  describe("importFormattedDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<FormattedDocumentField>({
        context: mockContext,
        data: undefined,
        name: "ПолеФорматированногоДокумента",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<FormattedDocumentField>({
        context: mockContext,
        data: fullFormattedDocumentFieldTypedEnterprise,
        name: "ПолеФорматированногоДокумента",
      })

      expect(result).toEqual(fullFormattedDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<FormattedDocumentField>({
        context: mockContext,
        data: minimalFormattedDocumentFieldTypedEnterprise,
        name: "ПолеФорматированногоДокумента",
      })

      expect(result).toEqual(minimalFormattedDocumentField)
    })
  })

  describe("importFormattedDocumentFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.FormattedDocumentField,
        data: fullFormattedDocumentFieldPartialEnterprise,
        source: fullFormattedDocumentField,
      })

      expect(result).toEqual(fullFormattedDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.FormattedDocumentField,
        data: minimalFormattedDocumentFieldPartialEnterprise,
        source: minimalFormattedDocumentField,
      })

      expect(result).toEqual(minimalFormattedDocumentField)
    })
  })
})
