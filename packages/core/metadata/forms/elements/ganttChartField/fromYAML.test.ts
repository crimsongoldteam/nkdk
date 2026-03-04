import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullGanttChartField,
  fullGanttChartFieldPartialYAML,
  minimalGanttChartField,
  minimalGanttChartFieldPartialYAML,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"

describe("importGanttChartFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "GanttChartField",
      yaml: fullGanttChartFieldPartialYAML,
      source: fullGanttChartField,
    })

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "GanttChartField",
      yaml: minimalGanttChartFieldPartialYAML,
      source: minimalGanttChartField,
    })

    expect(result).toEqual(minimalGanttChartField)
  })
})
