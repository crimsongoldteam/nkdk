import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullGanttChartField, fullGanttChartFieldEnterprise } from "~/metadata/forms/elements/ganttChartField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export GanttChartField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullGanttChartField,
    })
    expect(result).toEqual(fullGanttChartFieldEnterprise)
  })
})
