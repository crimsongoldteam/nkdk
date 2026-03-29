import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullGanttChartField,
  fullGanttChartFieldPartialYAML,
  minimalGanttChartField,
} from "~/metadata/forms/elements/ganttChartField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportGanttChartFieldToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullGanttChartField })

      expect(result).toEqual(fullGanttChartFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalGanttChartField })

      expect(result).toBeUndefined()
    })
  })
})
