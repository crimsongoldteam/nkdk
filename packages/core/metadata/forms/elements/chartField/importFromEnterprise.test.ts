import { describe, expect, it } from "vitest"
import {
  fullChartField,
  fullChartFieldPartialEnterprise,
  fullChartFieldTypedEnterprise,
  minimalChartField,
  minimalChartFieldPartialEnterprise,
  minimalChartFieldTypedEnterprise,
} from "~/tests/fixtures/forms/chartField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importChartFieldPartialFromEnterprise, importChartFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importChartFieldFromEnterprise", () => {
  describe("importChartFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importChartFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеДиаграммы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importChartFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullChartFieldTypedEnterprise,
        "ПолеДиаграммы"
      )

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importChartFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalChartFieldTypedEnterprise,
        "ПолеДиаграммы"
      )

      expect(result).toEqual(minimalChartField)
    })
  })

  describe("importChartFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importChartFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importChartFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullChartField,
        fullChartFieldPartialEnterprise
      )

      expect(result).toEqual(fullChartField)
    })

    it("should import minimal", () => {
      const result = importChartFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalChartField,
        minimalChartFieldPartialEnterprise
      )

      expect(result).toEqual(minimalChartField)
    })
  })
})
