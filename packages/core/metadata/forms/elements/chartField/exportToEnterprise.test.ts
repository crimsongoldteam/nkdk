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
  exportChartFieldPartialToEnterprise,
  exportChartFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportChartFieldToEnterprise", () => {
  describe("exportChartFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportChartFieldPartialToEnterprise(mockСontext, fullChartField)

      expect(result).toEqual(fullChartFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportChartFieldPartialToEnterprise(mockСontext, minimalChartField)

      expect(result).toEqual(minimalChartFieldPartialEnterprise)
    })
  })

  describe("exportChartFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportChartFieldTypedToEnterprise(mockСontext, fullChartField)

      expect(result).toEqual(fullChartFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportChartFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
