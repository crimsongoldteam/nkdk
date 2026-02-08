import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importTextDocumentFieldFromEnterprise", () => {
  describe("importTextDocumentFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.TextDocumentField,
        data: fullTextDocumentFieldPartialEnterprise,
        source: fullTextDocumentField,
      })

      expect(result).toEqual(fullTextDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.TextDocumentField,
        data: minimalTextDocumentFieldPartialEnterprise,
        source: minimalTextDocumentField,
      })

      expect(result).toEqual(minimalTextDocumentField)
    })
  })
})
