import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullColumnGroup, fullColumnGroupEnterprise } from "~/tests/fixtures/forms/columnGroup/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export ColumnGroup to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.ColumnGroup,
      value: fullColumnGroup,
    })
    expect(result).toEqual(fullColumnGroupEnterprise)
  })
})
