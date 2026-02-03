import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullInputFieldPartialEnterprise,
  fullInputFieldTypedEnterprise,
  minimalInputField,
  minimalInputFieldPartialEnterprise,
} from "~/tests/fixtures/forms/inputField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportInputFieldPartialToEnterprise, exportInputFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportInputFieldToEnterprise", () => {
  describe("exportInputFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportInputFieldPartialToEnterprise(mockContext, mockRule, fullInputField)

      expect(result).toEqual(fullInputFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportInputFieldPartialToEnterprise(mockContext, mockRule, minimalInputField)

      expect(result).toEqual(minimalInputFieldPartialEnterprise)
    })
  })

  describe("exportInputFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportInputFieldTypedToEnterprise(mockContext, mockRule, fullInputField)

      expect(result).toEqual(fullInputFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportInputFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
