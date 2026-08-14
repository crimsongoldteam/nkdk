import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { mockContext, mockContextFromXML } from "../../../tests/mockContext"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "./toYAML"
import { I8nTextPropertyRule, type I8nTextXML } from "./types"
import { createConfigurationLanguages, serializeYAMLDocument } from "@nkdk/runtime"
import { importI8nTextFromXML } from "./fromXML"

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

const russianOnlyContext = {
  ...contextWithExportToYAML,
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
}

const russianOnlyXMLContext = {
  ...mockContextFromXML(),
  languages: russianOnlyContext.languages,
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

    it.each([
      {
        name: "folds a canonical calculated default language",
        entries: [["ru", "Не выходить"], ["en", "Dont exit"]],
        contexts: undefined,
        expected: "Заголовок:\n  en: Dont exit",
      },
      {
        name: "marks an absent default language",
        entries: [["en", "Dont exit"]],
        contexts: undefined,
        expected: 'Заголовок:\n  ru: ""\n  en: Dont exit',
      },
      {
        name: "does not fold a noncanonical collection",
        entries: [["en", "Dont exit"], ["ru", "Не выходить"]],
        contexts: undefined,
        expected: "Заголовок: !xml/order\n  en: Dont exit\n  ru: Не выходить",
      },
      {
        name: "does not fold a duplicated calculated value",
        entries: [["ru", "Не выходить"], ["ru", "Не выходить"]],
        contexts: undefined,
        expected: "Заголовок:\n  ru: !xml/duplicate Не выходить",
      },
      {
        name: "classifies an unregistered language after folding",
        entries: [["ru", "Не выходить"], ["en", "Buttons"]],
        contexts: { xml: russianOnlyXMLContext, yaml: russianOnlyContext },
        expected: "Заголовок:\n  en: !xml/language Buttons",
      },
      {
        name: "combines an absent default marker with an unregistered language",
        entries: [["en", "Buttons"]],
        contexts: { xml: russianOnlyXMLContext, yaml: russianOnlyContext },
        expected: 'Заголовок:\n  ru: ""\n  en: !xml/language Buttons',
      },
      {
        name: "combines order and language anomalies",
        entries: [["en", "Buttons"], ["ru", "Не выходить"]],
        contexts: { xml: russianOnlyXMLContext, yaml: russianOnlyContext },
        expected: "Заголовок: !xml/order\n  en: !xml/language Buttons\n  ru: Не выходить",
      },
    ] as const)("$name", ({ entries, contexts, expected }) => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      expect(importAndSerialize(entries, rule, contexts)).toBe(expected)
    })
  })

  describe("exportI8nTextDefaultToYAML", () => {
    it.each(i8nTextFixtures)("should export default: $name", (fixture) => {
      const result = exportI8nTextDefaultToYAML(mockContext, fixture.text)
      expect(result).toEqual(fixture.defaultLanguageYAML)
    })
  })
})
