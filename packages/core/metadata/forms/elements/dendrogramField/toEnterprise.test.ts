import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullDendrogramField, fullDendrogramFieldEnterprise } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export DendrogramField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.DendrogramField,
      value: fullDendrogramField,
    })
    expect(result).toEqual(fullDendrogramFieldEnterprise)
  })
})
