import { describe, expect, it } from "vitest"
import {
  fullGanttChartField,
  fullGanttChartFieldPartialEnterprise,
  fullGanttChartFieldTypedEnterprise,
  minimalGanttChartField,
  minimalGanttChartFieldPartialEnterprise,
  minimalGanttChartFieldTypedEnterprise,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportGanttChartFieldPartialToEnterprise,
  exportGanttChartFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportGanttChartFieldToEnterprise", () => {
  describe("exportGanttChartFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGanttChartFieldPartialToEnterprise(mockСontext, fullGanttChartField)

      expect(result).toEqual(fullGanttChartFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportGanttChartFieldPartialToEnterprise(mockСontext, minimalGanttChartField)

      expect(result).toEqual(minimalGanttChartFieldPartialEnterprise)
    })
  })

  describe("exportGanttChartFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGanttChartFieldTypedToEnterprise(mockСontext, fullGanttChartField)

      expect(result).toEqual(fullGanttChartFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportGanttChartFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
