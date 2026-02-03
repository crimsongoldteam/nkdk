import { describe, expect, it } from "vitest"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  fullPlannerFieldTypedEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
  minimalPlannerFieldTypedEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPlannerFieldPartialFromEnterprise, importPlannerFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPlannerFieldFromEnterprise", () => {
  describe("importPlannerFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPlannerFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеПланировщика")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPlannerFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullPlannerFieldTypedEnterprise,
        "ПолеПланировщика"
      )

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importPlannerFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalPlannerFieldTypedEnterprise,
        "ПолеПланировщика"
      )

      expect(result).toEqual(minimalPlannerField)
    })
  })

  describe("importPlannerFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPlannerFieldPartialFromEnterprise(mockContext, mockRule, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPlannerFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullPlannerField,
        fullPlannerFieldPartialEnterprise
      )

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importPlannerFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalPlannerField,
        minimalPlannerFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPlannerField)
    })
  })
})
