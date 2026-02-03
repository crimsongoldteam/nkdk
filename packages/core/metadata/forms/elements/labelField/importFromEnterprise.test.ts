import { describe, expect, it } from "vitest"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
  minimalLabelFieldTypedEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importLabelFieldPartialFromEnterprise, importLabelFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importLabelFieldFromEnterprise", () => {
  describe("importLabelFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importLabelFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеНадписи")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        fullLabelFieldTypedEnterprise,
        "ПолеНадписи"
      )

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importLabelFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        minimalLabelFieldTypedEnterprise,
        "ПолеНадписи"
      )

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("importLabelFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importLabelFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importLabelFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        fullLabelField,
        fullLabelFieldPartialEnterprise
      )

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importLabelFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalLabelField,
        minimalLabelFieldPartialEnterprise
      )

      expect(result).toEqual(minimalLabelField)
    })
  })
})
