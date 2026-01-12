import { describe, expect, it } from "vitest"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialEnterprise,
  fullGeographicalSchemaFieldTypedEnterprise,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialEnterprise,
  minimalGeographicalSchemaFieldTypedEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportGeographicalSchemaFieldPartialToEnterprise,
  exportGeographicalSchemaFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportGeographicalSchemaFieldToEnterprise", () => {
  describe("exportGeographicalSchemaFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGeographicalSchemaFieldPartialToEnterprise(mockСontext, fullGeographicalSchemaField)

      expect(result).toEqual(fullGeographicalSchemaFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportGeographicalSchemaFieldPartialToEnterprise(mockСontext, minimalGeographicalSchemaField)

      expect(result).toEqual(minimalGeographicalSchemaFieldPartialEnterprise)
    })
  })

  describe("exportGeographicalSchemaFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGeographicalSchemaFieldTypedToEnterprise(mockСontext, fullGeographicalSchemaField)

      expect(result).toEqual(fullGeographicalSchemaFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportGeographicalSchemaFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
