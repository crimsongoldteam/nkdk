import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullLabelField,
  fullLabelFieldPartialYAML,
  fullLabelFieldTypedYAML,
  minimalLabelField,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportLabelFieldToYAML", () => {
  describe("Partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullLabelField })

      expect(result).toEqual(fullLabelFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalLabelField })

      expect(result).toBeUndefined()
    })
  })

  describe("Typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullLabelField })

      expect(result).toEqual(fullLabelFieldTypedYAML)
    })
  })
})
