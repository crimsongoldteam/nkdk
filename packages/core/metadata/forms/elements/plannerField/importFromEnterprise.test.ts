import { describe, expect, it } from "vitest"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  fullPlannerFieldTypedEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
  minimalPlannerFieldTypedEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importPlannerFieldPartialFromEnterprise,
  importPlannerFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importPlannerFieldFromEnterprise", () => {
  describe("importPlannerFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPlannerFieldTypedFromEnterprise(mockСontext, undefined, "ПолеПланировщика")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPlannerFieldTypedFromEnterprise(
        mockСontext,
        fullPlannerFieldTypedEnterprise,
        "ПолеПланировщика"
      )

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importPlannerFieldTypedFromEnterprise(
        mockСontext,
        minimalPlannerFieldTypedEnterprise,
        "ПолеПланировщика"
      )

      expect(result).toEqual(minimalPlannerField)
    })
  })

  describe("importPlannerFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPlannerFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPlannerFieldPartialFromEnterprise(
        mockСontext,
        fullPlannerField,
        fullPlannerFieldPartialEnterprise
      )

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importPlannerFieldPartialFromEnterprise(
        mockСontext,
        minimalPlannerField,
        minimalPlannerFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPlannerField)
    })
  })
})
