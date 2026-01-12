import { describe, expect, it } from "vitest"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialEnterprise,
  fullGraphicalSchemaFieldTypedEnterprise,
  minimalGraphicalSchemaField,
  minimalGraphicalSchemaFieldPartialEnterprise,
  minimalGraphicalSchemaFieldTypedEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importGraphicalSchemaFieldPartialFromEnterprise,
  importGraphicalSchemaFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importGraphicalSchemaFieldFromEnterprise", () => {
  describe("importGraphicalSchemaFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importGraphicalSchemaFieldTypedFromEnterprise(mockСontext, undefined, "ПолеГрафическойСхемы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGraphicalSchemaFieldTypedFromEnterprise(
        mockСontext,
        fullGraphicalSchemaFieldTypedEnterprise,
        "ПолеГрафическойСхемы"
      )

      expect(result).toEqual(fullGraphicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGraphicalSchemaFieldTypedFromEnterprise(
        mockСontext,
        minimalGraphicalSchemaFieldTypedEnterprise,
        "ПолеГрафическойСхемы"
      )

      expect(result).toEqual(minimalGraphicalSchemaField)
    })
  })

  describe("importGraphicalSchemaFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importGraphicalSchemaFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importGraphicalSchemaFieldPartialFromEnterprise(
        mockСontext,
        fullGraphicalSchemaField,
        fullGraphicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(fullGraphicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importGraphicalSchemaFieldPartialFromEnterprise(
        mockСontext,
        minimalGraphicalSchemaField,
        minimalGraphicalSchemaFieldPartialEnterprise
      )

      expect(result).toEqual(minimalGraphicalSchemaField)
    })
  })
})
