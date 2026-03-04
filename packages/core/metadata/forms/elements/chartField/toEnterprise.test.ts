import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullChartField, fullChartFieldEnterprise } from "~/tests/fixtures/forms/chartField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export ChartField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: "ChartField",
      value: fullChartField,
    })
    expect(result).toEqual(fullChartFieldEnterprise)
  })
})
