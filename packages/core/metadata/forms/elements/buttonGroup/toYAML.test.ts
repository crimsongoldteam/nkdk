import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import {
  fullButtonGroup,
  fullButtonGroupPartialYAML,
  fullButtonGroupTypedYAML,
  minimalButtonGroup,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportButtonGroupToYAML", () => {
  describe("Partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullButtonGroup })

      expect(result).toEqual(fullButtonGroupPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalButtonGroup })

      expect(result).toBeUndefined()
    })
  })

  describe("Typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullButtonGroup })

      expect(result).toEqual(fullButtonGroupTypedYAML)
    })
  })
})
