import {
createConfigurationLanguages,
parseMetadataYaml,
yamlMappingKeys
} from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { mockContext,mockRule } from "../../../tests/mockContext"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { importI8nTextFromYAML } from "./fromYAML"
import { I8nTextPropertyRule } from "./types"
import { importLocalizedItems,localizedItemOccurrences } from "./anomalies"

const multilingualContext = {
  ...mockContext,
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
}

describe("importI8nTextFromYAML", () => {
  describe("importI8nTextFromYAML", () => {
    it.each(i8nTextFixtures)("should import: $name", (fixture) => {
      const result = importI8nTextFromYAML({ context: mockContext, rule: mockRule, value: fixture.fullYAML })
      expect(result).toEqual(fixture.text)
    })

    it("читает повторные логические ключи через общую таблицу аннотаций", () => {
      const parsed = parseMetadataYaml([
        "ru: Основной",
        "en: English",
        "!xml/invalid ru: Повтор",
        "!xml/invalid/2 ru: Последний",
      ].join("\n"))

      const result = importI8nTextFromYAML({
        context: multilingualContext,
        rule: mockRule,
        value: parsed.data,
        annotations: parsed.annotations,
      })!

      expect(result.items).toEqual({ ru: "Основной", en: "English" })
      expect(localizedItemOccurrences(result.items)).toEqual([
        { language: "ru", content: "Основной" },
        { language: "en", content: "English" },
        { language: "ru", content: "Повтор" },
        { language: "ru", content: "Последний" },
      ])
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

    it("preserves YAML order before source-only languages", () => {
      const value = parseMetadataYaml(": Leading\nru: Override").data as Record<string, string>
      const result = importI8nTextFromYAML({
        context: mockContext,
        rule: mockRule,
        value,
        source: { items: { ru: "Source" } },
      })!

      expect(yamlMappingKeys(result.items)).toEqual(["", "ru"])
    })

    it("replaces source occurrence metadata with an explicit scalar value", () => {
      const result = importI8nTextFromYAML({
        context: mockContext,
        rule: mockRule,
        value: "Новый синоним",
        source: {
          items: importLocalizedItems({
            context: mockContext,
            items: [{ "v8:lang": "ru", "v8:content": "Старый синоним" }],
          }),
        },
      })!

      expect(localizedItemOccurrences(result.items)).toEqual([
        { language: "ru", content: "Новый синоним" },
      ])
    })
  })

  describe("excludeIfEqualNameYAML", () => {
    it("imports explicit empty text without a default-language item", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = importI8nTextFromYAML({
        context: mockContext,
        rule,
        name: "ОценкаОтправлена",
        value: "",
      })

      expect(result).toEqual({ items: {} })
    })

    it("restores an omitted default-language synonym from the name", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = importI8nTextFromYAML({
        context: mockContext,
        rule,
        name: "РегистрБухгалтерииПоУмолчанию",
        value: undefined,
        restoreExcludedEqualName: true,
      })

      expect(result).toEqual({
        items: {
          ru: "Регистр бухгалтерии по умолчанию",
        },
      })
    })

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

    it("does not restore an explicitly absent default language", () => {
      const parsed = parseMetadataYaml('ru: ""\nen: Dont exit')
      const value = parsed.data as Record<string, string>

      const result = importI8nTextFromYAML({
        context: multilingualContext,
        rule: { type: "I8nText", excludeIfEqualNameYAML: true },
        name: "НеВыходить",
        value,
      })

      expect(result).toEqual({ items: { en: "Dont exit" } })
    })
  })
})
