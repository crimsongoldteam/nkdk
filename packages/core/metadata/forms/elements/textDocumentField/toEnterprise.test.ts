import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullTextDocumentField,
  fullTextDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("export TextDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.TextDocumentField,
      value: fullTextDocumentField,
    })
    expect(result).toEqual(fullTextDocumentFieldEnterprise)
  })
})
