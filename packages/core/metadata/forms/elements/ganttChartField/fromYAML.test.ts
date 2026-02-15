import { describe, expect, it } from "vitest"
import {
  CollectionFormElementType,
  CollectionFormElementType,
  importElementFromPartialYAML,
} from "~/metadata/metadataFactory"
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
      itemType: CollectionFormElementType.GanttChartField,
      yaml: fullGanttChartFieldPartialEnterprise,
      source: fullGanttChartField,
    })

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.GanttChartField,
      yaml: minimalGanttChartFieldPartialEnterprise,
      source: minimalGanttChartField,
    })

    expect(result).toEqual(minimalGanttChartField)
  })
})
