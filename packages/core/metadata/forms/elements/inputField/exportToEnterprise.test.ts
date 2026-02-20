import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullInputField,
  fullInputFieldPartialYAML,
  fullInputFieldTypedYAML,
  minimalInputField,
} from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportInputFieldToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullInputField })

      expect(result).toEqual(fullInputFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalInputField })

      expect(result).toBeUndefined()
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullInputField })

      expect(result).toEqual(fullInputFieldTypedYAML)
    })
  })
})
