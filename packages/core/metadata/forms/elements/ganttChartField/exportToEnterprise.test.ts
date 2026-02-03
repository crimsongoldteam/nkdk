import { describe, expect, it } from "vitest"
import {
  fullGanttChartField,
  fullGanttChartFieldPartialEnterprise,
  fullGanttChartFieldTypedEnterprise,
  minimalGanttChartField,
  minimalGanttChartFieldPartialEnterprise,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportGanttChartFieldPartialToEnterprise, exportGanttChartFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportGanttChartFieldToEnterprise", () => {
  describe("exportGanttChartFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGanttChartFieldPartialToEnterprise(mockContext, mockRule, fullGanttChartField)

      expect(result).toEqual(fullGanttChartFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportGanttChartFieldPartialToEnterprise(mockContext, mockRule, minimalGanttChartField)

      expect(result).toEqual(minimalGanttChartFieldPartialEnterprise)
    })
  })

  describe("exportGanttChartFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGanttChartFieldTypedToEnterprise(mockContext, mockRule, fullGanttChartField)

      expect(result).toEqual(fullGanttChartFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportGanttChartFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
