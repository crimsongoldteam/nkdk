import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importHTMLDocumentFieldFromEnterprise", () => {
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
