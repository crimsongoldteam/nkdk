import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullButton, fullButtonEnterprise } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"

describe("export Button to Enterprise", () => {
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
      itemType: CollectionFormElementType.Button,
      value: fullButton,
    })
    expect(result).toEqual(fullButtonEnterprise)
  })
})
