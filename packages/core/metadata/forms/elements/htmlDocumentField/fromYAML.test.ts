import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialEnterprise,
  fullHtmlDocumentFieldTypedEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldPartialEnterprise,
  minimalHtmlDocumentFieldTypedEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { HTMLDocumentField } from "./types"

describe("importHTMLDocumentFieldFromEnterprise", () => {
  describe("importHTMLDocumentFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<HTMLDocumentField>({
        context: mockContext,
        data: undefined,
        name: "ПолеHTMLДокумента",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<HTMLDocumentField>({
        context: mockContext,
        data: fullHtmlDocumentFieldTypedEnterprise,
        name: "ПолеHTMLДокумента",
      })

      expect(result).toEqual(fullHtmlDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<HTMLDocumentField>({
        context: mockContext,
        data: minimalHtmlDocumentFieldTypedEnterprise,
        name: "ПолеHTMLДокумента",
      })

      expect(result).toEqual(minimalHtmlDocumentField)
    })
  })

  describe("importHTMLDocumentFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.HTMLDocumentField,
        data: fullHtmlDocumentFieldPartialEnterprise,
        source: fullHtmlDocumentField,
      })

      expect(result).toEqual(fullHtmlDocumentField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.HTMLDocumentField,
        data: minimalHtmlDocumentFieldPartialEnterprise,
        source: minimalHtmlDocumentField,
      })

      expect(result).toEqual(minimalHtmlDocumentField)
    })
  })
})
