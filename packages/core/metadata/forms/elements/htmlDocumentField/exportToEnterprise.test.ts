import { describe, expect, it } from "vitest"
import { fullHtmlDocumentField, fullHtmlDocumentFieldEnterprise, minimalHtmlDocumentField, minimalHtmlDocumentFieldEnterprise } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportHtmlDocumentFieldToEnterprise } from "./exportToEnterprise"

describe("exportHtmlDocumentFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportHtmlDocumentFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportHtmlDocumentFieldToEnterprise(mockСontext, fullHtmlDocumentField)

    expect(result).toEqual(fullHtmlDocumentFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportHtmlDocumentFieldToEnterprise(mockСontext, minimalHtmlDocumentField)

    expect(result).toEqual(minimalHtmlDocumentFieldEnterprise)
  })
})

