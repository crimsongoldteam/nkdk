import { describe, expect, it } from "vitest"
import {
  fullGanttChartField,
  fullGanttChartFieldEnterprise,
  minimalGanttChartField,
  minimalGanttChartFieldEnterprise,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockСontext } from "~/tests/mockContext"
import { importGanttChartFieldFromEnterprise } from "./importFromEnterprise"

describe("importGanttChartFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importGanttChartFieldFromEnterprise(mockСontext, undefined, fullGanttChartField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importGanttChartFieldFromEnterprise(
      mockСontext,
      fullGanttChartFieldEnterprise,
      fullGanttChartField.name
    )

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const result = importGanttChartFieldFromEnterprise(
      mockСontext,
      minimalGanttChartFieldEnterprise,
      minimalGanttChartField.name
    )

    expect(result).toEqual(minimalGanttChartField)
  })
})
