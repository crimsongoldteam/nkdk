import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullButtonGroup,
  fullButtonGroupPartialEnterprise,
  fullButtonGroupTypedEnterprise,
  minimalButtonGroup,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportButtonGroupToEnterprise", () => {
  describe("Partial", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullButtonGroup })

      expect(result).toEqual(fullButtonGroupPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalButtonGroup })

      expect(result).toBeUndefined()
    })
  })

  describe("Typed", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullButtonGroup })

      expect(result).toEqual(fullButtonGroupTypedEnterprise)
    })
  })
})
