import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialYAML,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/htmlDocumentField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importHTMLDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "HTMLDocumentField",
      yaml: fullHtmlDocumentFieldPartialYAML,
      source: fullHtmlDocumentField,
    })

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "HTMLDocumentField",
      yaml: minimalHtmlDocumentFieldPartialYAML,
      source: minimalHtmlDocumentField,
    })

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
