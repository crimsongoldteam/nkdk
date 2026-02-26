import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullLabelDecoration,
  fullLabelDecorationEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("export LabelDecoration to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.LabelDecoration,
      value: fullLabelDecoration,
    })
    expect(result).toEqual(fullLabelDecorationEnterprise)
  })
})
