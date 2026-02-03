import { describe, expect, it } from "vitest"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialEnterprise,
  fullGeographicalSchemaFieldTypedEnterprise,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  exportGeographicalSchemaFieldPartialToEnterprise,
  exportGeographicalSchemaFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportGeographicalSchemaFieldToEnterprise", () => {
  describe("exportGeographicalSchemaFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGeographicalSchemaFieldPartialToEnterprise(
        mockContext,
        mockRule,
        fullGeographicalSchemaField
      )

      expect(result).toEqual(fullGeographicalSchemaFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportGeographicalSchemaFieldPartialToEnterprise(
        mockContext,
        mockRule,
        minimalGeographicalSchemaField
      )

      expect(result).toEqual(minimalGeographicalSchemaFieldPartialEnterprise)
    })
  })

  describe("exportGeographicalSchemaFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGeographicalSchemaFieldTypedToEnterprise(mockContext, mockRule, fullGeographicalSchemaField)

      expect(result).toEqual(fullGeographicalSchemaFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportGeographicalSchemaFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
