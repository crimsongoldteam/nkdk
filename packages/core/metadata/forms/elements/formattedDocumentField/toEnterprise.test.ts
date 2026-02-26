import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("export FormattedDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.FormattedDocumentField,
      value: fullFormattedDocumentField,
    })
    expect(result).toEqual(fullFormattedDocumentFieldEnterprise)
  })
})
