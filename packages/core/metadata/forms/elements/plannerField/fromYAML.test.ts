import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPlannerFieldFromEnterprise", () => {
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
