import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullGanttChartField,
  fullGanttChartFieldEnterprise,
} from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"

describe("export GanttChartField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.GanttChartField,
      value: fullGanttChartField,
    })
    expect(result).toEqual(fullGanttChartFieldEnterprise)
  })
})
