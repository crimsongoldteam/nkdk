import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
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
        itemType: CollectionFormElementType.ChartField,
        yaml: fullChartFieldPartialYAML,
        source: fullChartField,
      })

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.ChartField,
        yaml: minimalChartFieldPartialYAML,
        source: minimalChartField,
      })

      expect(result).toEqual(minimalChartField)
    })
  })
})
