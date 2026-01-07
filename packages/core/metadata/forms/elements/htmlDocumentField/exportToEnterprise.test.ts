import { describe, expect, it } from "vitest"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldEnterprise,
  minimalHtmlDocumentField,
  minimalHtmlDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportHTMLDocumentFieldToEnterprise } from "./exportToEnterprise"

describe("exportHTMLDocumentFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportHTMLDocumentFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportHTMLDocumentFieldToEnterprise(mockСontext, fullHtmlDocumentField)

    expect(result).toEqual(fullHtmlDocumentFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportHTMLDocumentFieldToEnterprise(mockСontext, minimalHtmlDocumentField)

    expect(result).toEqual(minimalHtmlDocumentFieldEnterprise)
  })
})
