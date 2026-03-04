import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullUsualGroup, fullUsualGroupEnterprise } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("exportUsualGroupToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.UsualGroup,
      value: fullUsualGroup,
    })
    expect(result).toEqual(fullUsualGroupEnterprise)
  })
})
