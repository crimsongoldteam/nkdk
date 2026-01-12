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
  exportGraphicalSchemaFieldPartialToEnterprise,
  exportGraphicalSchemaFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportGraphicalSchemaFieldToEnterprise", () => {
  describe("exportGraphicalSchemaFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGraphicalSchemaFieldPartialToEnterprise(mockСontext, fullGraphicalSchemaField)

      expect(result).toEqual(fullGraphicalSchemaFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportGraphicalSchemaFieldPartialToEnterprise(mockСontext, minimalGraphicalSchemaField)

      expect(result).toEqual(minimalGraphicalSchemaFieldPartialEnterprise)
    })
  })

  describe("exportGraphicalSchemaFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportGraphicalSchemaFieldTypedToEnterprise(mockСontext, fullGraphicalSchemaField)

      expect(result).toEqual(fullGraphicalSchemaFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportGraphicalSchemaFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
