import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullInputFieldPartialEnterprise,
  fullInputFieldTypedEnterprise,
  minimalInputField,
  minimalInputFieldPartialEnterprise,
  minimalInputFieldTypedEnterprise,
} from "~/tests/fixtures/forms/inputField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importInputFieldPartialFromEnterprise, importInputFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importInputFieldFromEnterprise", () => {
  describe("importInputFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importInputFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеВвода")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importInputFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullInputFieldTypedEnterprise,
        "ПолеВвода"
      )

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importInputFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalInputFieldTypedEnterprise,
        "ПолеВвода"
      )

      expect(result).toEqual(minimalInputField)
    })
  })

  describe("importInputFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importInputFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importInputFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullInputField,
        fullInputFieldPartialEnterprise
      )

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importInputFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalInputField,
        minimalInputFieldPartialEnterprise
      )

      expect(result).toEqual(minimalInputField)
    })
  })
})
