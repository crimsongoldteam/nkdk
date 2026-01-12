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
  exportPlannerFieldPartialToEnterprise,
  exportPlannerFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportPlannerFieldToEnterprise", () => {
  describe("exportPlannerFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPlannerFieldPartialToEnterprise(mockСontext, fullPlannerField)

      expect(result).toEqual(fullPlannerFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportPlannerFieldPartialToEnterprise(mockСontext, minimalPlannerField)

      expect(result).toEqual(minimalPlannerFieldPartialEnterprise)
    })
  })

  describe("exportPlannerFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportPlannerFieldTypedToEnterprise(mockСontext, fullPlannerField)

      expect(result).toEqual(fullPlannerFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportPlannerFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
