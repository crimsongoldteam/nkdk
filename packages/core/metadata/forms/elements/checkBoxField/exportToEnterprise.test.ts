import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportCheckBoxFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullCheckBoxField })

      expect(result).toEqual(fullCheckBoxFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalCheckBoxField })

      expect(result).toBeUndefined()
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullCheckBoxField })

      expect(result).toEqual(fullCheckBoxFieldTypedEnterprise)
    })
  })
})
