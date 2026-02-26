import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullProgressBarField,
  fullProgressBarFieldEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("export ProgressBarField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.ProgressBarField,
      value: fullProgressBarField,
    })
    expect(result).toEqual(fullProgressBarFieldEnterprise)
  })
})
