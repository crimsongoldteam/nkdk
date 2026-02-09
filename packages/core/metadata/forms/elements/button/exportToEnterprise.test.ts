import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonTypedEnterprise,
  minimalButton,
} from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"

describe("exportButtonToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullButton })

      expect(result).toEqual(fullButtonPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalButton })

      expect(result).toBeUndefined()
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullButton })

      expect(result).toEqual(fullButtonTypedEnterprise)
    })
  })
})
