import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("export SpreadSheetDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.SpreadSheetDocumentField,
      value: fullSpreadSheetDocumentField,
    })
    expect(result).toEqual(fullSpreadSheetDocumentFieldEnterprise)
  })
})
