import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullGanttChartField,
  fullGanttChartFieldPartialEnterprise,
  fullGanttChartFieldTypedEnterprise,
  minimalGanttChartField,
  minimalGanttChartFieldPartialEnterprise,
  minimalGanttChartFieldTypedEnterprise,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"
import { GanttChartField } from "./types"

describe("importGanttChartFieldFromEnterprise", () => {
  describe("importGanttChartFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<GanttChartField>({
        context: mockContext,
        data: undefined,
        name: "ПолеДиаграммыГанта",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<GanttChartField>({
        context: mockContext,
        data: fullGanttChartFieldTypedEnterprise,
        name: "ПолеДиаграммыГанта",
      })

      expect(result).toEqual(fullGanttChartField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<GanttChartField>({
        context: mockContext,
        data: minimalGanttChartFieldTypedEnterprise,
        name: "ПолеДиаграммыГанта",
      })

      expect(result).toEqual(minimalGanttChartField)
    })
  })

  describe("importGanttChartFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.GanttChartField,
        data: fullGanttChartFieldPartialEnterprise,
        source: fullGanttChartField,
      })

      expect(result).toEqual(fullGanttChartField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.GanttChartField,
        data: minimalGanttChartFieldPartialEnterprise,
        source: minimalGanttChartField,
      })

      expect(result).toEqual(minimalGanttChartField)
    })
  })
})
