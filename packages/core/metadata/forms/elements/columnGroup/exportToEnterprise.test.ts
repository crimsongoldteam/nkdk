import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullColumnGroup,
  fullColumnGroupPartialYAML,
  fullColumnGroupTypedYAML,
  minimalColumnGroup,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportColumnGroupToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullColumnGroup })

      expect(result).toEqual(fullColumnGroupPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalColumnGroup })

      expect(result).toBeUndefined()
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullColumnGroup })

      expect(result).toEqual(fullColumnGroupTypedYAML)
    })
  })
})
