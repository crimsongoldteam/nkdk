import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullUsualGroup, fullUsualGroupEnterprise } from "~/metadata/forms/elements/usualGroup/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("exportUsualGroupToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullUsualGroup,
    })
    expect(result).toEqual(fullUsualGroupEnterprise)
  })
})
