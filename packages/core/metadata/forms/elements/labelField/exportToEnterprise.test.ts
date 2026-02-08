import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportLabelFieldToEnterprise", () => {
  describe("exportLabelFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullLabelField })

      expect(result).toEqual(fullLabelFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalLabelField })

      expect(result).toEqual(minimalLabelFieldPartialEnterprise)
    })
  })

  describe("exportLabelFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullLabelField })

      expect(result).toEqual(fullLabelFieldTypedEnterprise)
    })
  })
})
