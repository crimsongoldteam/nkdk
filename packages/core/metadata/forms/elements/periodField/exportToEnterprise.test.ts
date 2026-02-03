import { describe, expect, it } from "vitest"
import {
  fullPeriodField,
  fullPeriodFieldPartialEnterprise,
  fullPeriodFieldTypedEnterprise,
  minimalPeriodField,
  minimalPeriodFieldPartialEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportPeriodFieldPartialToEnterprise, exportPeriodFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportPeriodFieldToEnterprise", () => {
  describe("exportPeriodFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPeriodFieldPartialToEnterprise(mockContext, mockRule, fullPeriodField)

      expect(result).toEqual(fullPeriodFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPeriodFieldPartialToEnterprise(mockContext, mockRule, minimalPeriodField)

      expect(result).toEqual(minimalPeriodFieldPartialEnterprise)
    })
  })

  describe("exportPeriodFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPeriodFieldTypedToEnterprise(mockContext, mockRule, fullPeriodField)

      expect(result).toEqual(fullPeriodFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportPeriodFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
