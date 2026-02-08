import { describe, expect, it } from "vitest"
import {
  fullPages,
  fullPagesPartialEnterprise,
  fullPagesTypedEnterprise,
  minimalPages,
  minimalPagesPartialEnterprise,
  minimalPagesTypedEnterprise,
} from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"

describe("exportPagesToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPages })

      expect(result).toEqual(fullPagesPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPages })

      expect(result).toEqual(minimalPagesPartialEnterprise)
    })
  })

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullPages })

      expect(result).toEqual(fullPagesTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalPages })

      expect(result).toEqual(minimalPagesTypedEnterprise)
    })
  })
})
