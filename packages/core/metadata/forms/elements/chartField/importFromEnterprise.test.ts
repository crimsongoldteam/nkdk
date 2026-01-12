import { describe, expect, it } from "vitest"
import {
  fullChartField,
  fullChartFieldPartialEnterprise,
  fullChartFieldTypedEnterprise,
  minimalChartField,
  minimalChartFieldPartialEnterprise,
  minimalChartFieldTypedEnterprise,
} from "~/tests/fixtures/forms/chartField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importChartFieldPartialFromEnterprise,
  importChartFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importChartFieldFromEnterprise", () => {
  describe("importChartFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importChartFieldTypedFromEnterprise(mockСontext, undefined, "ПолеДиаграммы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importChartFieldTypedFromEnterprise(
        mockСontext,
        fullChartFieldTypedEnterprise,
        "ПолеДиаграммы"
      )

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importChartFieldTypedFromEnterprise(
        mockСontext,
        minimalChartFieldTypedEnterprise,
        "ПолеДиаграммы"
      )

      expect(result).toEqual(minimalChartField)
    })
  })

  describe("importChartFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importChartFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importChartFieldPartialFromEnterprise(
        mockСontext,
        fullChartField,
        fullChartFieldPartialEnterprise
      )

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importChartFieldPartialFromEnterprise(
        mockСontext,
        minimalChartField,
        minimalChartFieldPartialEnterprise
      )

      expect(result).toEqual(minimalChartField)
    })
  })
})
