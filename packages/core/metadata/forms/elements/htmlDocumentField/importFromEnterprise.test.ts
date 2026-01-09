import { describe, expect, it } from "vitest"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { importHTMLDocumentFieldFromEnterprise } from "./importFromEnterprise"

describe("importHTMLDocumentFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importHTMLDocumentFieldFromEnterprise(mockСontext, undefined, fullHtmlDocumentField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importHTMLDocumentFieldFromEnterprise(
      mockСontext,
      fullHtmlDocumentFieldEnterprise,
      fullHtmlDocumentField.name
    )

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const result = importHTMLDocumentFieldFromEnterprise(
      mockСontext,
      minimalHtmlDocumentFieldEnterprise,
      minimalHtmlDocumentField.name
    )

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
