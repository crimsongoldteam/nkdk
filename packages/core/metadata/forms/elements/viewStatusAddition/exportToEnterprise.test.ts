import { describe, expect, it } from "vitest"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
  minimalViewStatusAddition,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"

describe("exportViewStatusAdditionToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullViewStatusAddition })

      expect(result).toEqual(fullViewStatusAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalViewStatusAddition })

      expect(result).toBeUndefined()
    })
  })
})
