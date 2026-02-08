import { describe, expect, it } from "vitest"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialEnterprise,
  fullProgressBarFieldTypedEnterprise,
  minimalProgressBarField,
  minimalProgressBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportProgressBarFieldToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullProgressBarField })

      expect(result).toEqual(fullProgressBarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalProgressBarField })

      expect(result).toEqual(minimalProgressBarFieldPartialEnterprise)
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullProgressBarField })

      expect(result).toEqual(fullProgressBarFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })
  })
})
