import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullChartField,
  fullChartFieldPartialEnterprise,
  minimalChartField,
  minimalChartFieldPartialEnterprise,
} from "~/tests/fixtures/forms/chartField/data"
import { mockContext } from "~/tests/mockContext"

describe("importChartFieldFromEnterprise", () => {
  describe("importChartFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.ChartField,
        data: fullChartFieldPartialEnterprise,
        source: fullChartField,
      })

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.ChartField,
        data: minimalChartFieldPartialEnterprise,
        source: minimalChartField,
      })

      expect(result).toEqual(minimalChartField)
    })
  })
})
