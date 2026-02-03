import { describe, expect, it } from "vitest"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportLabelFieldPartialToEnterprise, exportLabelFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportLabelFieldToEnterprise", () => {
  describe("exportLabelFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportLabelFieldPartialToEnterprise(mockContext, mockRule, fullLabelField)

      expect(result).toEqual(fullLabelFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportLabelFieldPartialToEnterprise(mockContext, mockRule, minimalLabelField)

      expect(result).toEqual(minimalLabelFieldPartialEnterprise)
    })
  })

  describe("exportLabelFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportLabelFieldTypedToEnterprise(mockContext, mockRule, fullLabelField)

      expect(result).toEqual(fullLabelFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportLabelFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
