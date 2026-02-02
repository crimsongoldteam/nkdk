import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importI8nTextCombinedFromYAML, importI8nTextFromYAML } from "./importFromYAML"

describe("importI8nTextFromYAML", () => {
  describe("importI8nTextFromYAML", () => {
    it.each(i8nTextFixtures)("should import: $name", (fixture) => {
      const result = importI8nTextFromYAML(mockContext, mockRule, fixture.enterpriseFull)
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importI8nTextCombinedFromYAML", () => {
    it.each(i8nTextFixtures)("should import combined: $name", (fixture) => {
      const result = importI8nTextCombinedFromYAML(
        mockContext,
        mockRule,
        fixture.textFromStructure,
        fixture.enterpriseOtherLanguages
      )

      expect(result).toEqual(fixture.text)
    })
  })
})
