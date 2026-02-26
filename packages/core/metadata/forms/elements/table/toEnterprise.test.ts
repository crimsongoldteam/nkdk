import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullTable, fullTableEnterprise } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"

describe("export Table to Enterprise", () => {
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
      itemType: CollectionFormElementType.Table,
      value: fullTable,
    })
    expect(result).toEqual(fullTableEnterprise)
  })
})
