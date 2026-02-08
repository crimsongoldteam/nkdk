import { describe, expect, it } from "vitest"
import {
  fullPlannerField,
  fullPlannerFieldPartialEnterprise,
  fullPlannerFieldTypedEnterprise,
  minimalPlannerField,
  minimalPlannerFieldPartialEnterprise,
} from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportPlannerFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPlannerField })

      expect(result).toEqual(fullPlannerFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPlannerField })

      expect(result).toEqual(minimalPlannerFieldPartialEnterprise)
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullPlannerField })

      expect(result).toEqual(fullPlannerFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })
  })
})
