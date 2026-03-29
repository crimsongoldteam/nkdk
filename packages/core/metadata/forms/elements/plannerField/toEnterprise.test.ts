import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPlannerField, fullPlannerFieldEnterprise } from "~/metadata/forms/elements/plannerField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export PlannerField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPlannerField,
    })
    expect(result).toEqual(fullPlannerFieldEnterprise)
  })
})
