import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPeriodField, fullPeriodFieldEnterprise } from "~/tests/fixtures/forms/periodField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export PeriodField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPeriodField,
    })
    expect(result).toEqual(fullPeriodFieldEnterprise)
  })
})
