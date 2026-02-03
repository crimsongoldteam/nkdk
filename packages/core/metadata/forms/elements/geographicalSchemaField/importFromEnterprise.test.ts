import { describe, expect, it } from "vitest"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialEnterprise,
  fullGeographicalSchemaFieldTypedEnterprise,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialEnterprise,
  minimalGeographicalSchemaFieldTypedEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importGeographicalSchemaFieldPartialFromEnterprise,
  importGeographicalSchemaFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importGeographicalSchemaFieldFromEnterprise", () => {
  describe("importGeographicalSchemaFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importGeographicalSchemaFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        undefined,
        "ПолеГеографическойСхемы"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGeographicalSchemaFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullGeographicalSchemaFieldTypedEnterprise,
        "ПолеГеографическойСхемы"
      )

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGeographicalSchemaFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalGeographicalSchemaFieldTypedEnterprise,
        "ПолеГеографическойСхемы"
      )

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })

  describe("importGeographicalSchemaFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importGeographicalSchemaFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importGeographicalSchemaFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullGeographicalSchemaField,
        fullGeographicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGeographicalSchemaFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalGeographicalSchemaField,
        minimalGeographicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
