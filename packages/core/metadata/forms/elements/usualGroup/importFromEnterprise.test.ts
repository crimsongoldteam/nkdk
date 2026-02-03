import { describe, expect, it } from "vitest"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  fullUsualGroupTypedEnterprise,
  minimalUsualGroup,
  minimalUsualGroupTypedEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importUsualGroupPartialFromEnterprise, importUsualGroupTypedFromEnterprise } from "./importFromEnterprise"

describe("importUsualGroupFromEnterprise", () => {
  describe("importUsualGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importUsualGroupTypedFromEnterprise(mockContext, mockRule, undefined, "ОбычнаяГруппа")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importUsualGroupTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        fullUsualGroupTypedEnterprise,
        "ОбычнаяГруппа"
      )

      expect(result).toEqual(fullUsualGroup)
    })

    it("should import minimal", () => {
      const result = importUsualGroupTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        minimalUsualGroupTypedEnterprise,
        "ОбычнаяГруппа"
      )

      expect(result).toEqual(minimalUsualGroup)
    })
  })

  describe("importUsualGroupPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importUsualGroupPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importUsualGroupPartialFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        fullUsualGroup,
        fullUsualGroupPartialEnterprise
      )

      expect(result).toEqual(fullUsualGroup)
    })
  })
})
