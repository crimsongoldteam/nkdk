import { describe, expect, it } from "vitest"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  fullUsualGroupTypedEnterprise,
  minimalUsualGroup,
  minimalUsualGroupTypedEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { importUsualGroupPartialFromEnterprise, importUsualGroupTypedFromEnterprise } from "./importFromEnterprise"

describe("importUsualGroupFromEnterprise", () => {
  describe("importUsualGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importUsualGroupTypedFromEnterprise(mockContext, undefined, "ОбычнаяГруппа")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importUsualGroupTypedFromEnterprise(mockContext, fullUsualGroupTypedEnterprise, "ОбычнаяГруппа")

      expect(result).toEqual(fullUsualGroup)
    })

    it("should import minimal", () => {
      const result = importUsualGroupTypedFromEnterprise(mockContext, minimalUsualGroupTypedEnterprise, "ОбычнаяГруппа")

      expect(result).toEqual(minimalUsualGroup)
    })
  })

  describe("importUsualGroupPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importUsualGroupPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importUsualGroupPartialFromEnterprise(mockContext, fullUsualGroup, fullUsualGroupPartialEnterprise)

      expect(result).toEqual(fullUsualGroup)
    })
  })
})
