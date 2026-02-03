import { describe, expect, it } from "vitest"
import {
  fullChartField,
  fullChartFieldPartialEnterprise,
  fullChartFieldTypedEnterprise,
  minimalChartField,
  minimalChartFieldPartialEnterprise,
} from "~/tests/fixtures/forms/chartField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportChartFieldPartialToEnterprise, exportChartFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportChartFieldToEnterprise", () => {
  describe("exportChartFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportChartFieldPartialToEnterprise(mockContext, mockRule, fullChartField)

      expect(result).toEqual(fullChartFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportChartFieldPartialToEnterprise(mockContext, mockRule, minimalChartField)

      expect(result).toEqual(minimalChartFieldPartialEnterprise)
    })
  })

  describe("exportChartFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportChartFieldTypedToEnterprise(mockContext, mockRule, fullChartField)

      expect(result).toEqual(fullChartFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportChartFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
