import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullButtonGroup, fullButtonGroupEnterprise } from "~/metadata/forms/elements/buttonGroup/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export ButtonGroup to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullButtonGroup,
    })
    expect(result).toEqual(fullButtonGroupEnterprise)
  })
})
