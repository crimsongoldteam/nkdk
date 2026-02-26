import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullPlannerField,
  fullPlannerFieldEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"

describe("export PlannerField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.PlannerField,
      value: fullPlannerField,
    })
    expect(result).toEqual(fullPlannerFieldEnterprise)
  })
})
