import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullChartField, fullChartFieldEnterprise } from "~/metadata/forms/elements/chartField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export ChartField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullChartField,
    })
    expect(result).toEqual(fullChartFieldEnterprise)
  })
})
