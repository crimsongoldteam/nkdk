import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullCommandBar, fullCommandBarEnterprise } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"

describe("export CommandBar to Enterprise", () => {
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
      itemType: CollectionFormElementType.CommandBar,
      value: fullCommandBar,
    })
    expect(result).toEqual(fullCommandBarEnterprise)
  })
})
