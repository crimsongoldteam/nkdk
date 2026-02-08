import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullGanttChartField,
  fullGanttChartFieldPartialEnterprise,
  minimalGanttChartField,
  minimalGanttChartFieldPartialEnterprise,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"

describe("importGanttChartFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.GanttChartField,
      data: fullGanttChartFieldPartialEnterprise,
      source: fullGanttChartField,
    })

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.GanttChartField,
      data: minimalGanttChartFieldPartialEnterprise,
      source: minimalGanttChartField,
    })

    expect(result).toEqual(minimalGanttChartField)
  })
})
