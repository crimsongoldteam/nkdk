import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialEnterprise,
  minimalHtmlDocumentField,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportHTMLDocumentFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullHtmlDocumentField })

    expect(result).toEqual(fullHtmlDocumentFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalHtmlDocumentField })

    expect(result).toBeUndefined()
  })
})
