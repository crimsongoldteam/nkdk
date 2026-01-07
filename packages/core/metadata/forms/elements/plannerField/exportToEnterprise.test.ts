import { describe, expect, it } from "vitest"
import {
  fullPlannerField,
  fullPlannerFieldEnterprise,
  minimalPlannerField,
  minimalPlannerFieldEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPlannerFieldToEnterprise } from "./exportToEnterprise"

describe("exportPlannerFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPlannerFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPlannerFieldToEnterprise(mockСontext, fullPlannerField)

    expect(result).toEqual(fullPlannerFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPlannerFieldToEnterprise(mockСontext, minimalPlannerField)

    expect(result).toEqual(minimalPlannerFieldEnterprise)
  })
})
