import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullCommandBar, fullCommandBarEnterprise } from "~/tests/fixtures/forms/commandBar/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export CommandBar to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullCommandBar,
    })
    expect(result).toEqual(fullCommandBarEnterprise)
  })
})
