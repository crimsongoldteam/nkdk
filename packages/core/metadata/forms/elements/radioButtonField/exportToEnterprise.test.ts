import { describe, expect, it } from "vitest"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialEnterprise,
  fullRadioButtonFieldTypedEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  exportRadioButtonFieldPartialToEnterprise,
  exportRadioButtonFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportRadioButtonFieldToEnterprise", () => {
  describe("exportRadioButtonFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportRadioButtonFieldPartialToEnterprise(mockContext, mockRule, fullRadioButtonField)

      expect(result).toEqual(fullRadioButtonFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportRadioButtonFieldPartialToEnterprise(mockContext, mockRule, minimalRadioButtonField)

      expect(result).toEqual(minimalRadioButtonFieldPartialEnterprise)
    })
  })

  describe("exportRadioButtonFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportRadioButtonFieldTypedToEnterprise(mockContext, mockRule, fullRadioButtonField)

      expect(result).toEqual(fullRadioButtonFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportRadioButtonFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
