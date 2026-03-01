import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullButton, fullButtonEnterprise } from "~/tests/fixtures/forms/button/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export Button to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.Button,
      value: fullButton,
    })
    expect(result).toEqual(fullButtonEnterprise)
  })
})
