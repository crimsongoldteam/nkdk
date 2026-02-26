import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullTrackBarField,
  fullTrackBarFieldEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("export TrackBarField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.TrackBarField,
      value: fullTrackBarField,
    })
    expect(result).toEqual(fullTrackBarFieldEnterprise)
  })
})
