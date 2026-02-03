import { describe, expect, it } from "vitest"
import {
  fullPages,
  fullPagesPartialEnterprise,
  fullPagesTypedEnterprise,
  minimalPages,
  minimalPagesTypedEnterprise,
} from "~/tests/fixtures/forms/pages/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPagesPartialFromEnterprise, importPagesTypedFromEnterprise } from "./importFromEnterprise"

describe("importPagesFromEnterprise", () => {
  describe("importPagesTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPagesTypedFromEnterprise(mockContext, mockRule, undefined, "Страницы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPagesTypedFromEnterprise(mockContext, mockRule, fullPagesTypedEnterprise, "Страницы")

      expect(result).toEqual(fullPages)
    })

    it("should import minimal", () => {
      const result = importPagesTypedFromEnterprise(mockContext, mockRule, minimalPagesTypedEnterprise, "Страницы")

      expect(result).toEqual(minimalPages)
    })
  })

  describe("importPagesPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPagesPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPagesPartialFromEnterprise(mockContext, mockRule, fullPages, fullPagesPartialEnterprise)

      expect(result).toEqual(fullPages)
    })
  })
})
