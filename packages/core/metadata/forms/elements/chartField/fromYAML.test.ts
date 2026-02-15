import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
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
        itemType: CollectionFormElementType.ChartField,
        yaml: fullChartFieldPartialEnterprise,
        source: fullChartField,
      })

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.ChartField,
        yaml: minimalChartFieldPartialEnterprise,
        source: minimalChartField,
      })

      expect(result).toEqual(minimalChartField)
    })
  })
})
