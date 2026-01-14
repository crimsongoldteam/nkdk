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
  importGanttChartFieldPartialFromEnterprise,
  importGanttChartFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importGanttChartFieldFromEnterprise", () => {
  describe("importGanttChartFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importGanttChartFieldTypedFromEnterprise(mockСontext, undefined, "ПолеДиаграммыГанта")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGanttChartFieldTypedFromEnterprise(
        mockСontext,
        fullGanttChartFieldTypedEnterprise,
        "ПолеДиаграммыГанта"
      )

      expect(result).toEqual(fullGanttChartField)
    })

    it("should import minimal", () => {
      const result = importGanttChartFieldTypedFromEnterprise(
        mockСontext,
        minimalGanttChartFieldTypedEnterprise,
        "ПолеДиаграммыГанта"
      )

      expect(result).toEqual(minimalGanttChartField)
    })
  })

  describe("importGanttChartFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importGanttChartFieldPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importGanttChartFieldPartialFromEnterprise(
        mockСontext,
        fullGanttChartField,
        fullGanttChartFieldPartialEnterprise
      )

      expect(result).toEqual(fullGanttChartField)
    })

    it("should import minimal", () => {
      const result = importGanttChartFieldPartialFromEnterprise(
        mockСontext,
        minimalGanttChartField,
        minimalGanttChartFieldPartialEnterprise
      )

      expect(result).toEqual(minimalGanttChartField)
    })
  })
})
