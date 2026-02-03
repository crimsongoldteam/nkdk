import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importI8nTextCombinedFromEnterprise, importI8nTextFromEnterprise } from "./importFromEnterprise"

describe("importI8nTextFromEnterprise", () => {
  describe("importI8nTextFromEnterprise", () => {
    it.each(i8nTextFixtures)("should import: $name", (fixture) => {
      const result = importI8nTextFromEnterprise(mockContext, mockRule, fixture.enterpriseFull)
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importI8nTextCombinedFromEnterprise", () => {
    it.each(i8nTextFixtures)("should import combined: $name", (fixture) => {
      const result = importI8nTextCombinedFromEnterprise(
        mockContext,
        mockRule,
        fixture.textFromStructure,
        fixture.enterpriseOtherLanguages
      )

      expect(result).toEqual(fixture.text)
    })
  })
})
