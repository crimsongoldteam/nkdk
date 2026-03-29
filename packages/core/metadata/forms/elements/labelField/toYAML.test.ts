import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import {
  fullLabelField,
  fullLabelFieldPartialYAML,
  fullTableLabelField,
  fullTableLabelFieldTypedYAML,
  minimalLabelField,
  minimalTableLabelField,
  minimalTableLabelFieldTypedYAML,
} from "~/metadata/forms/elements/labelField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportLabelFieldToYAML", () => {
  describe("LabelField partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullLabelField })

      expect(result).toEqual(fullLabelFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalLabelField })

      expect(result).toBeUndefined()
    })
  })

  describe("TableLabelField typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullTableLabelField })

      expect(result).toEqual(fullTableLabelFieldTypedYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalTableLabelField })

      expect(result).toEqual(minimalTableLabelFieldTypedYAML)
    })
  })
})
