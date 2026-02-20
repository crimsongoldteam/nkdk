import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullButton,
  fullButtonPartialYAML,
  fullButtonTypedYAML,
  minimalButton,
} from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"

describe("exportButtonToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullButton })

      expect(result).toEqual(fullButtonPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalButton })

      expect(result).toBeUndefined()
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullButton })

      expect(result).toEqual(fullButtonTypedYAML)
    })
  })
})
