import { describe, expect, it } from "vitest"
import { fullGanttChartField, fullGanttChartFieldEnterprise, minimalGanttChartField, minimalGanttChartFieldEnterprise } from "~/tests/fixtures/forms/ganttChartField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportGanttChartFieldToEnterprise } from "./exportToEnterprise"

describe("exportGanttChartFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportGanttChartFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportGanttChartFieldToEnterprise(mockСontext, fullGanttChartField)

    expect(result).toEqual(fullGanttChartFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportGanttChartFieldToEnterprise(mockСontext, minimalGanttChartField)

    expect(result).toEqual(minimalGanttChartFieldEnterprise)
  })
})

