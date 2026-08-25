import { createConfigurationLanguages,serializeYAMLDocument } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { mockContext,mockContextFromXML } from "../../../tests/mockContext"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { importI8nTextFromXML } from "./fromXML"
import { exportI8nTextDefaultToYAML,exportI8nTextToYAML } from "./toYAML"
import { I8nTextPropertyRule,type I8nTextXML } from "./types"

const contextWithExportToYAML = {
  ...mockContext,
  exportToYAML: { toTyped: false },
}

const multilingualContext = {
  ...contextWithExportToYAML,
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
}

const multilingualXMLContext = {
  ...mockContextFromXML(),
  languages: multilingualContext.languages,
}

function xmlItems(entries: readonly (readonly [string, string])[]): I8nTextXML {
  return {
    "v8:item": entries.map(([language, content]) => ({
      "v8:lang": language,
      "v8:content": content,
    })),
  }
}

function importAndSerialize(
  entries: readonly (readonly [string, string])[],
  rule: I8nTextPropertyRule,
  contexts = { xml: multilingualXMLContext, yaml: multilingualContext },
): string {
  const value = importI8nTextFromXML(contexts.xml, rule, xmlItems(entries))
  const yaml = exportI8nTextToYAML({
    context: contexts.yaml,
    rule,
    value,
    name: "НеВыходить",
  })
  return serializeYAMLDocument({ Заголовок: yaml }).text
}

describe("exportI8nTextToYAML", () => {
  describe("exportI8nTextToYAML", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const rule: I8nTextPropertyRule = { type: "I8nText" }

      const result = exportI8nTextToYAML({ context: contextWithExportToYAML, rule, value: fixture.text })
      expect(result).toEqual(fixture.fullYAML)
    })

    it("exports explicit empty text when empty XML must be preserved", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", preserveEmptyXML: true }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        value: { items: {} },
      })

      expect(result).toBe("")
    })

    it("omits empty text without empty XML preservation", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText" }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        value: { items: {} },
      })

      expect(result).toBeUndefined()
    })

    it("preserves the source order when an empty service language is present", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText" }

      expect(importAndSerialize([
        ["", "Служебный текст"],
        ["ru", "Русский текст"],
      ], rule)).toBe("Заголовок:\n  : Служебный текст\n  ru: Русский текст")
    })
  })

  describe("excludeIfEqualNameYAML", () => {
    it("exports explicit empty text", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        name: "ОценкаОтправлена",
        value: { items: {} },
      })

      expect(result).toBe("")
    })

    it("does not copy translations when default language differs from the name", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }
      const items = { ru: "Пользовательский заголовок", en: "Custom title" }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        name: "ОценкаОтправлена",
        value: { items },
      })

      expect(result).toBe(items)
    })

    it("keeps non-default languages when default language equals the name", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        name: "ОценкаОтправлена",
        value: { items: { ru: "Оценка отправлена", en: "Rating sent" } },
      })

      expect(result).toEqual({ en: "Rating sent" })
    })
  })

  describe("exportI8nTextDefaultToYAML", () => {
    it.each(i8nTextFixtures)("should export default: $name", (fixture) => {
      const result = exportI8nTextDefaultToYAML(mockContext, fixture.text)
      expect(result).toEqual(fixture.defaultLanguageYAML)
    })
  })
})
