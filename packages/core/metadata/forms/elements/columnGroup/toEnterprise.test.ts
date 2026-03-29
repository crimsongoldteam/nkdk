import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullColumnGroup, fullColumnGroupEnterprise } from "~/metadata/forms/elements/columnGroup/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export ColumnGroup to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullColumnGroup,
    })
    expect(result).toEqual(fullColumnGroupEnterprise)
  })
})
