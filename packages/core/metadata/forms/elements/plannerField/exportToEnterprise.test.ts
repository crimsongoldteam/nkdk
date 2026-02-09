import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  minimalPlannerField,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPlannerFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullPlannerField })

    expect(result).toEqual(fullPlannerFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalPlannerField })

    expect(result).toBeUndefined()
  })
})
