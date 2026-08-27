import {
  createConfigurationLanguages,
  createXmlAnomalyAnnotations,
  parseMetadataYaml,
  serializeYAMLDocument,
  xmlAnnotatedMappingEntries,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"

import { testPropertyFromXMLToYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"

const rule = {
  itemType: "I8nTextProbe",
  properties: {
    title: { type: "I8nText", yaml: "Заголовок", xml: "Title" },
  },
} as const satisfies MetadataItemRule

const context = {
  ...mockContextFromXML(),
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
  exportToYAML: { toTyped: false },
}

const repeatedLanguageItems = [
  { "v8:lang": "ru", "v8:content": "Первый" },
  { "v8:lang": "en", "v8:content": "Text" },
  { "v8:lang": "ru", "v8:content": "Второй" },
  { "v8:lang": "ru", "v8:content": "Третий" },
]

describe("I8nText XML → YAML", () => {
  it("использует общий адресный ряд для разнесённых дублей языка", () => {
    const annotations = createXmlAnomalyAnnotations()
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      context,
      annotations,
      xml: {
        Title: {
          "v8:item": repeatedLanguageItems,
        },
      },
    })
    const data = yaml as { Заголовок: Record<string, unknown> }

    expect(xmlAnnotatedMappingEntries(data.Заголовок, annotations)).toEqual([
      ["ru", "Первый"],
      ["en", "Text"],
      ["ru", "Второй"],
      ["ru", "Третий"],
    ])
    expect(serializeYAMLDocument(data, annotations).text).toBe([
      "Заголовок:",
      "  ru: Первый",
      "  en: Text",
      "  !xml/invalid ru: Второй",
      "  !xml/invalid/2 ru: Третий",
    ].join("\n"))
  })

  it("продолжает общий адресный ряд для дубля незарегистрированного языка", () => {
    const annotations = createXmlAnomalyAnnotations()
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      context,
      annotations,
      xml: {
        Title: {
          "v8:item": [
            { "v8:lang": "de", "v8:content": "Eins" },
            { "v8:lang": "de", "v8:content": "Zwei" },
          ],
        },
      },
    })

    expect(serializeYAMLDocument(yaml, annotations).text).toBe([
      "Заголовок:",
      "  !xml/invalid de: Eins",
      "  !xml/invalid/2 de: Zwei",
    ].join("\n"))
  })

  it("не считает служебный пустой код незарегистрированным языком", () => {
    const annotations = createXmlAnomalyAnnotations()
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      context,
      annotations,
      xml: {
        Title: {
          "v8:item": [
            { "v8:lang": "", "v8:content": "Служебный текст" },
            { "v8:lang": "ru", "v8:content": "Текст" },
          ],
        },
      },
    })

    expect(serializeYAMLDocument(yaml, annotations).text).toBe([
      "Заголовок:",
      "  : Служебный текст",
      "  ru: Текст",
    ].join("\n"))
  })

  it("не сворачивает дубли основного языка в scalar", () => {
    const annotations = createXmlAnomalyAnnotations()
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      context,
      annotations,
      xml: {
        Title: {
          "v8:item": [
            { "v8:lang": "ru", "v8:content": "Первый" },
            { "v8:lang": "ru", "v8:content": "Второй" },
          ],
        },
      },
    })

    expect(serializeYAMLDocument(yaml, annotations).text).toBe([
      "Заголовок:",
      "  ru: Первый",
      "  !xml/invalid ru: Второй",
    ].join("\n"))
  })

  it("восстанавливает каждый помеченный дубль отдельным v8:item", () => {
    const parsed = parseMetadataYaml([
      "Заголовок:",
      "  ru: Первый",
      "  en: Text",
      "  !xml/invalid ru: Второй",
      "  !xml/invalid/2 ru: Третий",
    ].join("\n"))

    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: parsed.data,
      annotations: parsed.annotations,
    })

    expect(xml).toEqual({
      Title: {
        "v8:item": repeatedLanguageItems,
      },
    })
  })
})
