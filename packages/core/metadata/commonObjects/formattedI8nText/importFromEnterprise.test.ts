import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importFormattedI8nTextFromYAML } from "./importFromEnterprise"

describe("importFormattedI8nTextFromEnterprise", () => {
  describe("importFormattedI8nTextFromEnterprise", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML(
        mockContext,
        mockRule,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importFormattedI8nTextCombinedFromEnterprise", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML(
        mockContext,
        mockRule,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText,
        fixture.textFromStructure
      )
      expect(result).toEqual(fixture.text)
    })
  })
})
