import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportSearchStringAdditionToEnterprise", () => {
  describe("exportElementToTypedYAML", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullSingleSearchStringAddition })

      expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalSingleSearchStringAddition })

      expect(result).toBeUndefined()
    })
  })

  describe("exportElementToPartialYAML", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullSearchStringAddition })

      expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalSearchStringAddition })

      expect(result).toBeUndefined()
    })
  })
})
