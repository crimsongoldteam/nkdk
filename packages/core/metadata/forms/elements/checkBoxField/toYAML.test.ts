import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialYAML,
  fullTableCheckBoxField,
  fullTableCheckBoxFieldTypedYAML,
  minimalCheckBoxField,
  minimalTableCheckBoxField,
  minimalTableCheckBoxFieldTypedYAML,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportCheckBoxFieldToYAML", () => {
  describe("CheckBoxField partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullCheckBoxField })

      expect(result).toEqual(fullCheckBoxFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalCheckBoxField })

      expect(result).toBeUndefined()
    })
  })

  describe("TableCheckBoxField typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullTableCheckBoxField })

      expect(result).toEqual(fullTableCheckBoxFieldTypedYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalTableCheckBoxField })

      expect(result).toEqual(minimalTableCheckBoxFieldTypedYAML)
    })
  })
})
