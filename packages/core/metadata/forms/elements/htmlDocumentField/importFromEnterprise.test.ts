import { describe, expect, it } from "vitest"
import { fullHtmlDocumentField, fullHtmlDocumentFieldEnterprise, minimalHtmlDocumentField, minimalHtmlDocumentFieldEnterprise } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { importHtmlDocumentFieldFromEnterprise } from "./importFromEnterprise"

describe("importHtmlDocumentFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importHtmlDocumentFieldFromEnterprise(mockСontext, undefined, fullHtmlDocumentField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importHtmlDocumentFieldFromEnterprise(mockСontext, fullHtmlDocumentFieldEnterprise, fullHtmlDocumentField.name)
    result!.id = "1"

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const result = importHtmlDocumentFieldFromEnterprise(mockСontext, minimalHtmlDocumentFieldEnterprise, minimalHtmlDocumentField.name)
    result!.id = "1"

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})

