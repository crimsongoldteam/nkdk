import { describe, expect, it } from "vitest"
import {
  fullColumnGroup,
  fullColumnGroupPartialEnterprise,
  fullColumnGroupTypedEnterprise,
  minimalColumnGroup,
  minimalColumnGroupTypedEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importColumnGroupPartialFromEnterprise, importColumnGroupTypedFromEnterprise } from "./importFromEnterprise"

describe("importColumnGroupFromEnterprise", () => {
  describe("importColumnGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importColumnGroupTypedFromEnterprise(mockContext, mockRule, undefined, "ГруппаКолонок")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importColumnGroupTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        fullColumnGroupTypedEnterprise,
        "ГруппаКолонок"
      )

      expect(result).toEqual(fullColumnGroup)
    })

    it("should import minimal", () => {
      const result = importColumnGroupTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalColumnGroupTypedEnterprise,
        "ГруппаКолонок"
      )

      expect(result).toEqual(minimalColumnGroup)
    })
  })

  describe("importColumnGroupPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importColumnGroupPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importColumnGroupPartialFromEnterprise(
        mockContext,
        mockRule,
        fullColumnGroup,
        fullColumnGroupPartialEnterprise
      )

      expect(result).toEqual(fullColumnGroup)
    })
  })
})
