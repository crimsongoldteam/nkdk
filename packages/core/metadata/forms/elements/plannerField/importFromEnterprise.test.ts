import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  fullPlannerFieldTypedEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
  minimalPlannerFieldTypedEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"
import { PlannerField } from "./types"

describe("importPlannerFieldFromEnterprise", () => {
  describe("importPlannerFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<PlannerField>({
        context: mockContext,
        data: undefined,
        name: "ПолеПланировщика",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<PlannerField>({
        context: mockContext,
        data: fullPlannerFieldTypedEnterprise,
        name: "ПолеПланировщика",
      })

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<PlannerField>({
        context: mockContext,
        data: minimalPlannerFieldTypedEnterprise,
        name: "ПолеПланировщика",
      })

      expect(result).toEqual(minimalPlannerField)
    })
  })

  describe("importPlannerFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PlannerField,
        data: fullPlannerFieldPartialEnterprise,
        source: fullPlannerField,
      })

      expect(result).toEqual(fullPlannerField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PlannerField,
        data: minimalPlannerFieldPartialEnterprise,
        source: minimalPlannerField,
      })

      expect(result).toEqual(minimalPlannerField)
    })
  })
})
