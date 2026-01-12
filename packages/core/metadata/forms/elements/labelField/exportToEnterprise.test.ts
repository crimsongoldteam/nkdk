import { describe, expect, it } from "vitest"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportLabelFieldPartialToEnterprise, exportLabelFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportLabelFieldToEnterprise", () => {
  describe("exportLabelFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportLabelFieldPartialToEnterprise(mockСontext, fullLabelField)

      expect(result).toEqual(fullLabelFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportLabelFieldPartialToEnterprise(mockСontext, minimalLabelField)

      expect(result).toEqual(minimalLabelFieldPartialEnterprise)
    })
  })

  describe("exportLabelFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportLabelFieldTypedToEnterprise(mockСontext, fullLabelField)

      expect(result).toEqual(fullLabelFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportLabelFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
