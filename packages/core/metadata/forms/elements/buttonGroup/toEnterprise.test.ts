import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullButtonGroup, fullButtonGroupEnterprise } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("export ButtonGroup to Enterprise", () => {
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
      itemType: "ButtonGroup",
      value: fullButtonGroup,
    })
    expect(result).toEqual(fullButtonGroupEnterprise)
  })
})
