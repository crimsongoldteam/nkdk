import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullUsualGroup, fullUsualGroupEnterprise } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportUsualGroupToEnterprise", () => {
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
      itemType: CollectionFormElementType.UsualGroup,
      value: fullUsualGroup,
    })
    expect(result).toEqual(fullUsualGroupEnterprise)
  })
})
