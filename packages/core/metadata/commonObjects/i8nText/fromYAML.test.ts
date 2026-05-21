import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importI8nTextFromYAML } from "./fromYAML"
import { I8nTextPropertyRule } from "./types"

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

  describe("excludeIfEqualNameYAML", () => {
    it("restores default language from the name and preserves non-default languages", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = importI8nTextFromYAML({
        context: mockContext,
        rule,
        name: "ОценкаОтправлена",
        value: { en: "Rating sent" },
      })

      expect(result).toEqual({
        items: {
          ru: "Оценка отправлена",
          en: "Rating sent",
        },
      })
    })

    it("does not restore default language from the name when source does not contain it", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = importI8nTextFromYAML({
        context: mockContext,
        rule,
        name: "ОценкаОтправлена",
        value: { en: "Оценка отправлена" },
        source: { items: { en: "Оценка отправлена" } },
      })

      expect(result).toEqual({
        items: {
          en: "Оценка отправлена",
        },
      })
    })
  })
})
