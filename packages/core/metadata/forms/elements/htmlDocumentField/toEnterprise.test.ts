import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("export HTMLDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.HTMLDocumentField,
      value: fullHtmlDocumentField,
    })
    expect(result).toEqual(fullHtmlDocumentFieldEnterprise)
  })
})
