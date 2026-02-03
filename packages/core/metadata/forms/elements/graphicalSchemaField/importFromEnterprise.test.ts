import { describe, expect, it } from "vitest"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialEnterprise,
  fullGraphicalSchemaFieldTypedEnterprise,
  minimalGraphicalSchemaField,
  minimalGraphicalSchemaFieldPartialEnterprise,
  minimalGraphicalSchemaFieldTypedEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importGraphicalSchemaFieldPartialFromEnterprise,
  importGraphicalSchemaFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importGraphicalSchemaFieldFromEnterprise", () => {
  describe("importGraphicalSchemaFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importGraphicalSchemaFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        undefined,
        "ПолеГрафическойСхемы"
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGraphicalSchemaFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullGraphicalSchemaFieldTypedEnterprise,
        "ПолеГрафическойСхемы"
      )

      expect(result).toEqual(fullGraphicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGraphicalSchemaFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalGraphicalSchemaFieldTypedEnterprise,
        "ПолеГрафическойСхемы"
      )

      expect(result).toEqual(minimalGraphicalSchemaField)
    })
  })

  describe("importGraphicalSchemaFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importGraphicalSchemaFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importGraphicalSchemaFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullGraphicalSchemaField,
        fullGraphicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(fullGraphicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGraphicalSchemaFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalGraphicalSchemaField,
        minimalGraphicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(minimalGraphicalSchemaField)
    })
  })
})
