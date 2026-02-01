import { describe, expect, it } from "vitest"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialEnterprise,
  fullGraphicalSchemaFieldTypedEnterprise,
  minimalGraphicalSchemaField,
  minimalGraphicalSchemaFieldPartialEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import {
  exportGraphicalSchemaFieldPartialToEnterprise,
  exportGraphicalSchemaFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportGraphicalSchemaFieldToEnterprise", () => {
  describe("exportGraphicalSchemaFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGraphicalSchemaFieldPartialToEnterprise(mockContext, fullGraphicalSchemaField)

      expect(result).toEqual(fullGraphicalSchemaFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportGraphicalSchemaFieldPartialToEnterprise(mockContext, minimalGraphicalSchemaField)

      expect(result).toEqual(minimalGraphicalSchemaFieldPartialEnterprise)
    })
  })

  describe("exportGraphicalSchemaFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGraphicalSchemaFieldTypedToEnterprise(mockContext, fullGraphicalSchemaField)

      expect(result).toEqual(fullGraphicalSchemaFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportGraphicalSchemaFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
