import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullDendrogramField,
  fullDendrogramFieldEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"

describe("export DendrogramField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.DendrogramField,
      value: fullDendrogramField,
    })
    expect(result).toEqual(fullDendrogramFieldEnterprise)
  })
})
