import { describe, expect, it } from "vitest"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  fullPlannerFieldTypedEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportPlannerFieldPartialToEnterprise, exportPlannerFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportPlannerFieldToEnterprise", () => {
  describe("exportPlannerFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPlannerFieldPartialToEnterprise(mockContext, mockRule, fullPlannerField)

      expect(result).toEqual(fullPlannerFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPlannerFieldPartialToEnterprise(mockContext, mockRule, minimalPlannerField)

      expect(result).toEqual(minimalPlannerFieldPartialEnterprise)
    })
  })

  describe("exportPlannerFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPlannerFieldTypedToEnterprise(mockContext, mockRule, fullPlannerField)

      expect(result).toEqual(fullPlannerFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportPlannerFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
