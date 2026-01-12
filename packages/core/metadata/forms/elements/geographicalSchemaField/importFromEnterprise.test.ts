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
  importGeographicalSchemaFieldPartialFromEnterprise,
  importGeographicalSchemaFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importGeographicalSchemaFieldFromEnterprise", () => {
  describe("importGeographicalSchemaFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importGeographicalSchemaFieldTypedFromEnterprise(mockСontext, undefined, "ПолеГеографическойСхемы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGeographicalSchemaFieldTypedFromEnterprise(
        mockСontext,
        fullGeographicalSchemaFieldTypedEnterprise,
        "ПолеГеографическойСхемы"
      )

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGeographicalSchemaFieldTypedFromEnterprise(
        mockСontext,
        minimalGeographicalSchemaFieldTypedEnterprise,
        "ПолеГеографическойСхемы"
      )

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })

  describe("importGeographicalSchemaFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importGeographicalSchemaFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGeographicalSchemaFieldPartialFromEnterprise(
        mockСontext,
        fullGeographicalSchemaField,
        fullGeographicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGeographicalSchemaFieldPartialFromEnterprise(
        mockСontext,
        minimalGeographicalSchemaField,
        minimalGeographicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
