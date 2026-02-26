import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullColumnGroup,
  fullColumnGroupEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("export ColumnGroup to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.ColumnGroup,
      value: fullColumnGroup,
    })
    expect(result).toEqual(fullColumnGroupEnterprise)
  })
})
