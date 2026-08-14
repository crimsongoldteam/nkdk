import {
  createConfigurationLanguages,
  markYAMLMappingTag,
  markYAMLScalarTag,
  parseMetadataYaml,
  serializeYAMLDocument,
  xmlAnomalyTagValue,
  yamlMappingTagOf,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { importLocalizedItems, exportLocalizedItems, isCanonicalLanguageOrder } from "./anomalies"
import type { I8nTextLanguageXML } from "./types"
import { importI8nTextFromXML } from "./fromXML"
import { exportI8nTextToYAML } from "./toYAML"
import { importI8nTextFromYAML } from "./fromYAML"
import { exportI8nTextToXML } from "./toXML"

const context = {
  ...mockContext,
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
}

const contextWithoutEnglish = {
  ...mockContext,
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
}

const numericLanguageContext = {
  ...mockContext,
  languages: createConfigurationLanguages({ default: "10", registered: ["10", "2"] }),
}

const numericLanguageContextWithTwoAsDefault = {
  ...mockContext,
  languages: createConfigurationLanguages({ default: "2", registered: ["2", "10"] }),
}

const item = (language: string, content: string): I8nTextLanguageXML => ({
  "v8:lang": language,
  "v8:content": content,
})

function importedYAML(
  items: readonly I8nTextLanguageXML[],
  importContext = context,
): string {
  const localized = importLocalizedItems({ context: importContext, items })
  return serializeYAMLDocument({ Заголовок: localized }).text
}

describe("localized XML language anomalies", () => {
  it.each([
    {
      name: "canonical registered languages",
      items: [item("ru", "Текст"), item("en", "Text")],
      expected: "Заголовок:\n  ru: Текст\n  en: Text",
    },
    {
      name: "missing default language",
      items: [item("en", "Text")],
      expected: "Заголовок:\n  en: Text",
    },
    {
      name: "reversed registered languages",
      items: [item("en", "Text"), item("ru", "Текст")],
      expected: "Заголовок: !xml/order\n  en: Text\n  ru: Текст",
    },
    {
      name: "canonical unregistered language",
      items: [item("ru", "Текст"), item("en", "Text")],
      importContext: contextWithoutEnglish,
      expected: "Заголовок:\n  ru: Текст\n  en: !xml/language Text",
    },
    {
      name: "reversed unregistered language",
      items: [item("en", "Text"), item("ru", "Текст")],
      importContext: contextWithoutEnglish,
      expected: "Заголовок: !xml/order\n  en: !xml/language Text\n  ru: Текст",
    },
  ])("imports $name", ({ items, importContext, expected }) => {
    expect(importedYAML(items, importContext)).toBe(expected)
  })

  it.each([
    [["ru", "en"], true],
    [["en"], true],
    [["en", "ru"], false],
    [["ru", "ru", "en"], true],
  ] as const)("classifies order %j", (codes, expected) => {
    expect(isCanonicalLanguageOrder(codes, "ru")).toBe(expected)
  })

  it("preserves two adjacent identical registered items", () => {
    const items = importLocalizedItems({
      context,
      items: [item("ru", "Группа"), item("ru", "Группа"), item("en", "Group")],
    })

    expect(yamlScalarTagAt(items, "ru")).toBe("xml/duplicate")
    expect(yamlMappingTagOf(items)).toBeUndefined()
    expect(serializeYAMLDocument({ Заголовок: items }).text).toBe(
      "Заголовок:\n  ru: !xml/duplicate Группа\n  en: Group",
    )
    expect(exportLocalizedItems({ context, items })).toEqual([
      item("ru", "Группа"),
      item("ru", "Группа"),
      item("en", "Group"),
    ])
  })

  it("combines order and duplicate anomalies", () => {
    const items = importLocalizedItems({
      context,
      items: [item("en", "Group"), item("ru", "Группа"), item("ru", "Группа")],
    })

    expect(yamlMappingTagOf(items)).toBe("xml/order")
    expect(yamlScalarTagAt(items, "ru")).toBe("xml/duplicate")
    expect(exportLocalizedItems({ context, items })).toEqual([
      item("en", "Group"),
      item("ru", "Группа"),
      item("ru", "Группа"),
    ])
  })

  it.each([
    ["three repetitions", [item("ru", "A"), item("ru", "A"), item("ru", "A")]],
    ["different contents", [item("ru", "A"), item("ru", "B")]],
    ["separated repetitions", [item("ru", "A"), item("en", "B"), item("ru", "A")]],
  ])("rejects $name", (_name, items) => {
    expect(() => importLocalizedItems({ context, items })).toThrow(/повтор/u)
  })

  it("rejects duplicate unregistered language", () => {
    expect(() =>
      importLocalizedItems({
        context: contextWithoutEnglish,
        items: [item("en", "A"), item("en", "A")],
      }),
    ).toThrow(/незарегистрирован/u)
  })

  it("leaves service language codes to the legacy path", () => {
    const items = importLocalizedItems({
      context,
      items: [item("#", "Service"), item("ru", "Текст")],
    })

    expect(items).toEqual({ "#": "Service", ru: "Текст" })
    expect(yamlMappingTagOf(items)).toBeUndefined()
    expect(yamlScalarTagAt(items, "#")).toBeUndefined()
  })

  it("exports canonical order without mapping tag", () => {
    const items = {
      en: xmlAnomalyTagValue("xml/language", "Text"),
      ru: "Текст",
    }
    markYAMLScalarTag(items, "en", "xml/language")

    expect(exportLocalizedItems({ context: contextWithoutEnglish, items })).toEqual([
      item("ru", "Текст"),
      item("en", "Text"),
    ])
  })

  it("rejects an unrelated anomaly tag during export", () => {
    const items = { ru: xmlAnomalyTagValue("xml/present", "Текст") }
    markYAMLScalarTag(items, "ru", "xml/present")

    expect(() => exportLocalizedItems({ context, items })).toThrow(/!xml\/present/u)
  })

  it("preserves insertion order with mapping tag", () => {
    const items = { en: "Text", ru: "Текст" }
    markYAMLMappingTag(items, "xml/order")

    expect(exportLocalizedItems({ context, items })).toEqual([
      item("en", "Text"),
      item("ru", "Текст"),
    ])
  })

  it("preserves canonical numeric-like language order through YAML", () => {
    const originalItems = [item("10", "Ten"), item("2", "Two")]
    const localized = importLocalizedItems({ context: numericLanguageContext, items: originalItems })
    const serialized = serializeYAMLDocument({ Заголовок: localized }).text
    const parsed = parseMetadataYaml(serialized).data as { Заголовок: Record<string, string> }
    const restored = importI8nTextFromYAML({
      context: numericLanguageContext,
      rule: { type: "I8nText" },
      value: parsed.Заголовок,
    })

    expect(serialized).toBe('Заголовок:\n  "10": Ten\n  "2": Two')
    expect(exportI8nTextToXML(numericLanguageContext, { type: "I8nText" }, restored)?.["v8:item"]).toEqual(originalItems)
  })

  it("preserves anomalous numeric-like language order through YAML", () => {
    const originalItems = [item("10", "Ten"), item("2", "Two")]
    const localized = importLocalizedItems({ context: numericLanguageContextWithTwoAsDefault, items: originalItems })
    const serialized = serializeYAMLDocument({ Заголовок: localized }).text
    const parsed = parseMetadataYaml(serialized).data as { Заголовок: Record<string, string> }
    const restored = importI8nTextFromYAML({
      context: numericLanguageContextWithTwoAsDefault,
      rule: { type: "I8nText" },
      value: parsed.Заголовок,
    })

    expect(serialized).toBe('Заголовок: !xml/order\n  "10": Ten\n  "2": Two')
    expect(exportI8nTextToXML(numericLanguageContextWithTwoAsDefault, { type: "I8nText" }, restored)?.["v8:item"]).toEqual(originalItems)
  })

  it("preserves the special language code __proto__", () => {
    const specialContext = {
      ...mockContext,
      languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "__proto__"] }),
    }
    const originalItems = [item("ru", "Текст"), item("__proto__", "Prototype")]
    const localized = importLocalizedItems({ context: specialContext, items: originalItems })

    expect(Object.hasOwn(localized, "__proto__")).toBe(true)
    expect(exportLocalizedItems({ context: specialContext, items: localized })).toEqual(originalItems)
  })

  it("preserves combined anomalies through serialized YAML", () => {
    const rule = { type: "I8nText", excludeIfEqualNameYAML: true } as const
    const originalItems = [
      item("en", "Dont exit"),
      item("ru", "Не выходить"),
      item("ru", "Не выходить"),
    ]
    const model = importI8nTextFromXML(context, rule, { "v8:item": originalItems })
    const yaml = exportI8nTextToYAML({
      context: { ...context, exportToYAML: { toTyped: false } },
      rule,
      value: model,
      name: "НеВыходить",
    })
    const serialized = serializeYAMLDocument({ Заголовок: yaml }).text
    const parsed = parseMetadataYaml(serialized).data as { Заголовок: Record<string, string> }
    const restored = importI8nTextFromYAML({
      context,
      rule,
      value: parsed.Заголовок,
      name: "НеВыходить",
    })

    expect(serialized).toBe(
      "Заголовок: !xml/order\n  en: Dont exit\n  ru: !xml/duplicate Не выходить",
    )
    expect(exportI8nTextToXML(context, rule, restored)?.["v8:item"]).toEqual(originalItems)
  })
})
