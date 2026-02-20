import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importI8nTextFromYAML } from "./fromYAML"

describe("importI8nTextFromYAML", () => {
  describe("importI8nTextFromYAML", () => {
    it.each(i8nTextFixtures)("should import: $name", (fixture) => {
      const result = importI8nTextFromYAML({ context: mockContext, rule: mockRule, value: fixture.fullYAML })
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importI8nTextCombinedFromYAML", () => {
    it.each(i8nTextFixtures)("should import combined: $name", (fixture) => {
      const result = importI8nTextFromYAML({
        context: mockContext,
        rule: mockRule,
        value: fixture.otherLanguagesYAML,
        source: fixture.textFromStructure,
      })

      expect(result).toEqual(fixture.text)
    })
  })
})
