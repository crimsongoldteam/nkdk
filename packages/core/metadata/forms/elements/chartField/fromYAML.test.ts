import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullChartField,
  fullChartFieldPartialYAML,
  minimalChartField,
  minimalChartFieldPartialYAML,
} from "~/tests/fixtures/forms/chartField/data"
import { mockContext } from "~/tests/mockContext"

describe("importChartFieldFromYAML", () => {
  describe("importChartFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "ChartField",
        yaml: fullChartFieldPartialYAML,
        source: fullChartField,
      })

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "ChartField",
        yaml: minimalChartFieldPartialYAML,
        source: minimalChartField,
      })

      expect(result).toEqual(minimalChartField)
    })
  })
})
