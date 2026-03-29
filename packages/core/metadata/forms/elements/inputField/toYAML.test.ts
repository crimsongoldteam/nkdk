import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullInputFieldPartialYAML,
  fullTableInputField,
  fullTableInputFieldTypedYAML,
  minimalInputField,
  minimalTableInputField,
  minimalTableInputFieldTypedYAML,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

describe("exportInputFieldToYAML", () => {
  describe("InputField partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullInputField })

      expect(result).toEqual(fullInputFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalInputField })

      expect(result).toBeUndefined()
    })
  })

  describe("TableInputField typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullTableInputField })

      expect(result).toEqual(fullTableInputFieldTypedYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalTableInputField })

      expect(result).toEqual(minimalTableInputFieldTypedYAML)
    })
  })
})
