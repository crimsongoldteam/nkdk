import { describe, expect, it } from "vitest"
import { fullPlannerField, fullPlannerFieldEnterprise, minimalPlannerField, minimalPlannerFieldEnterprise } from "~/tests/fixtures/forms/plannerField/data"
import { mockСontext } from "~/tests/mockContext"
import { importPlannerFieldFromEnterprise } from "./importFromEnterprise"

describe("importPlannerFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPlannerFieldFromEnterprise(mockСontext, undefined, fullPlannerField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPlannerFieldFromEnterprise(mockСontext, fullPlannerFieldEnterprise, fullPlannerField.name)

    expect(result).toEqual(fullPlannerField)
  })

  it("should import minimal", () => {
    const result = importPlannerFieldFromEnterprise(mockСontext, minimalPlannerFieldEnterprise, minimalPlannerField.name)

    expect(result).toEqual(minimalPlannerField)
  })
})


