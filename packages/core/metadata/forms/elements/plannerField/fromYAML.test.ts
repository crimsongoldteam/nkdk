import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullPlannerField,
  fullPlannerFieldPartialYAML,
  minimalPlannerField,
  minimalPlannerFieldPartialYAML,
} from "~/metadata/forms/elements/plannerField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importPlannerFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PlannerField",
      yaml: fullPlannerFieldPartialYAML,
      source: fullPlannerField,
    })

    expect(result).toEqual(fullPlannerField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PlannerField",
      yaml: minimalPlannerFieldPartialYAML,
      source: minimalPlannerField,
    })

    expect(result).toEqual(minimalPlannerField)
  })
})
