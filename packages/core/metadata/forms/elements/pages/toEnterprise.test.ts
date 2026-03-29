import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPages, fullPagesEnterprise } from "~/metadata/forms/elements/pages/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export Pages to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPages,
    })
    expect(result).toEqual(fullPagesEnterprise)
  })
})
