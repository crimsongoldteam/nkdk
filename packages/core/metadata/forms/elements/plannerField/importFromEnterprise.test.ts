import { describe, expect, it } from "vitest"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  fullPlannerFieldTypedEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
  minimalPlannerFieldTypedEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"
import { importPlannerFieldPartialFromEnterprise, importPlannerFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPlannerFieldFromEnterprise", () => {
  describe("importPlannerFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPlannerFieldTypedFromEnterprise(mockContext, undefined, "ПолеПланировщика")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPlannerFieldTypedFromEnterprise(
        mockContext,
        fullPlannerFieldTypedEnterprise,
        "ПолеПланировщика"
      )

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importPlannerFieldTypedFromEnterprise(
        mockContext,
        minimalPlannerFieldTypedEnterprise,
        "ПолеПланировщика"
      )

      expect(result).toEqual(minimalPlannerField)
    })
  })

  describe("importPlannerFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPlannerFieldPartialFromEnterprise(mockContext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPlannerFieldPartialFromEnterprise(
        mockContext,
        fullPlannerField,
        fullPlannerFieldPartialEnterprise
      )

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importPlannerFieldPartialFromEnterprise(
        mockContext,
        minimalPlannerField,
        minimalPlannerFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPlannerField)
    })
  })
})
