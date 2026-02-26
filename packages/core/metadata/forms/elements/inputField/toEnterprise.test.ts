import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullInputField, fullInputFieldEnterprise } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"

describe("export InputField to Enterprise", () => {
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
      itemType: CollectionFormElementType.InputField,
      value: fullInputField,
    })
    expect(result).toEqual(fullInputFieldEnterprise)
  })
})
