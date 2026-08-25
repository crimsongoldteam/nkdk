import {
  parseMetadataYaml,
  parseXmlDocumentWithSaxes,
  xmlAnnotatedMappingEntries,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { buildPreparedAssignmentXml } from "../fullSyncToXml/xmlAnomalyAssignment"
import { prepareTestXmlAnomalyAssignment } from "./testSupport"

const rootRule = {
  itemType: "XmlAnomalyRulesProbe",
  properties: {
    value: { type: "string", yaml: "Значение", xml: "Properties\\Value" },
  },
} as const satisfies MetadataItemRule

describe("XML-аномалии неизвестных и повторных свойств rules.ts", () => {
  it("одинаково восстанавливает raw на известном и неизвестном вложенном пути", () => {
    const prepared = prepare([
      "Значение: !xml/raw",
      "  $значение: ordinary",
      "  $xml: { \"#text\": \"01\" }",
      "Properties\\Future: !xml/raw",
      "  $xml:",
      "    _mode: custom",
      "    Child: value",
    ].join("\n"))
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Probe.xml",
        xml: { Root: { Properties: { Value: "ordinary" } } },
        deferred: [],
        rootRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(parseXmlDocumentWithSaxes(xml).compatibility).toMatchObject({
      Root: {
        Properties: {
          Value: "01",
          Future: { _mode: "custom", Child: "value" },
        },
      },
    })
  })

  it("сохраняет все физические повторы именованного ключа", () => {
    const parsed = parseMetadataYaml([
      "Реквизиты:",
      "  Код: { Тип: Строка }",
      "  !xml/invalid Код: { Тип: Число }",
      "  !xml/invalid/2 Код: { Тип: Булево }",
    ].join("\n"))
    const collection = (parsed.data as { Реквизиты: Record<string, unknown> }).Реквизиты

    expect(parsed.syntaxErrors).toEqual([])
    expect(xmlAnnotatedMappingEntries(collection, parsed.annotations)).toEqual([
      ["Код", { Тип: "Строка" }],
      ["Код", { Тип: "Число" }],
      ["Код", { Тип: "Булево" }],
    ])
  })

  it.each([
    "!xml/raw\n$xml: { Future: value }",
    "Значение: !xml/raw\n  $значение: ordinary",
    "!xml/raw Значение: ordinary",
  ])("отклоняет недопустимый договор raw: %s", (yaml) => {
    expect(parseMetadataYaml(yaml).syntaxErrors.length).toBeGreaterThan(0)
  })
})

function prepare(yaml: string) {
  const parsed = parseMetadataYaml(yaml)
  expect(parsed.syntaxErrors).toEqual([])
  return prepareTestXmlAnomalyAssignment({
    parsed,
    rootRule,
    runtime: { requiresImportant: () => false },
  })
}
