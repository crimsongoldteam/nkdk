import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
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
      itemType: CollectionFormElementType.HTMLDocumentField,
      yaml: fullHtmlDocumentFieldPartialEnterprise,
      source: fullHtmlDocumentField,
    })

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.HTMLDocumentField,
      yaml: minimalHtmlDocumentFieldPartialEnterprise,
      source: minimalHtmlDocumentField,
    })

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
