import {
  createConfigurationLanguages,
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
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

const foldedRule = {
  itemType: "FoldedI8nTextProbe",
  properties: {
    title: {
      type: "I8nText",
      yaml: "Заголовок",
      xml: "Title",
      excludeIfEqualNameYAML: true,
      skipEmptyToXML: true,
      defaultValue: ({ context, name }: { context: { languages: { default: string } }; name?: string }) => ({
        items: { [context.languages.default]: name === "ДинамическийСписок" ? "Динамический список" : "" },
      }),
    },
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

  it("не добавляет служебный язык items при экспорте с XML-референсом", () => {
    const annotations = createXmlAnomalyAnnotations()
    const referenceXML = {
      Title: {
        "v8:item": [{ "v8:lang": "ru", "v8:content": "Заголовок" }],
      },
    }
    const { yaml } = testPropertyFromXMLToYAML({ rule, context, annotations, xml: referenceXML })

    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml,
      annotations,
      referenceXML,
    })

    expect(xml).toEqual(referenceXML)
  })

  it("не добавляет служебный язык items для свёрнутого заголовка с XML-референсом", () => {
    const referenceXML = {
      Title: {
        "v8:item": [{ "v8:lang": "ru", "v8:content": "Динамический список" }],
      },
    }
    const { yaml } = testPropertyFromXMLToYAML({
      rule: foldedRule,
      context,
      xml: referenceXML,
      name: "ДинамическийСписок",
    })
    expect(yaml).toEqual({})

    const { xml } = testPropertyFromYAMLToXML({
      rule: foldedRule,
      yaml,
      name: "ДинамическийСписок",
      referenceXML,
    })

    expect(xml).toEqual(referenceXML)
  })

  it("сохраняет маркер отсутствующего заголовка из смыслового default", () => {
    const referenceXML = {}
    const { yaml } = testPropertyFromXMLToYAML({
      rule: foldedRule,
      context,
      xml: referenceXML,
      name: "Команда1",
    })

    expect(yaml).toEqual({ Заголовок: "" })
    expect(testPropertyFromYAMLToXML({
      rule: foldedRule,
      yaml,
      name: "Команда1",
      referenceXML,
    }).xml).toEqual(referenceXML)
  })

  it("сохраняет пустой XML сворачиваемого текста как короткий пустой маркер", () => {
    const emptyFoldedRule = {
      itemType: "EmptyFoldedI8nTextProbe",
      properties: {
        title: {
          type: "I8nText",
          yaml: "Заголовок",
          xml: "Title",
          excludeIfEqualNameYAML: true,
        },
      },
    } as const satisfies MetadataItemRule

    const xml = parseXmlDocumentWithSaxes("<Root><Title/></Root>", {
      preserveEmptyElements: true,
    }).roots[0]!
    const audit = createXmlImportAuditSession([xml])
    const { yaml } = testPropertyFromXMLToYAML({
      rule: emptyFoldedRule,
      context,
      xml,
      name: "БизнесПроцесс1",
      audit,
    })
    audit.finalize()

    expect(yaml).toEqual({ Заголовок: "" })
    expect(audit.outcomes().map(({ node, state }) => [node.path, state])).toEqual([
      ["/Root[1]", "claimed"],
      ["/Root[1]/Title[1]", "claimed"],
    ])
    expect(testPropertyFromYAMLToXML({
      rule: emptyFoldedRule,
      yaml,
      name: "БизнесПроцесс1",
      referenceXML: xml.compatibilityValue,
    }).xml).toEqual({ Title: {} })
    expect(testPropertyFromYAMLToXML({
      rule: emptyFoldedRule,
      yaml,
      name: "БизнесПроцесс1",
      referenceXML: {
        Title: {
          "v8:item": { "v8:lang": "ru", "v8:content": "Старое значение" },
        },
      },
    }).xml).toEqual({ Title: {} })
  })
})
