import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPlannerFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PlannerField,
      yaml: fullPlannerFieldPartialEnterprise,
      source: fullPlannerField,
    })

    expect(result).toEqual(fullPlannerField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PlannerField,
      yaml: minimalPlannerFieldPartialEnterprise,
      source: minimalPlannerField,
    })

    expect(result).toEqual(minimalPlannerField)
  })
})
