import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  readAppliedObjectFixture,
  serializeDirectXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import { PredefinedRules } from "./rules"

import "./types"

describe("Predefined YAML → XML", () => {
  it("inline-record парсится в items без обёртки", () => {
    const result = convertYAML({
      ПредопределенноеЗначение: { Код: "000000001", Наименование: "Тест", ЭтоГруппа: "Ложь" },
    })
    expect(result).toContain("<Name>ПредопределенноеЗначение</Name>")
    expect(result).toContain("<Code>000000001</Code>")
  })

  it("round-trip from full.xml", () => {
    const referenceXML = readAppliedObjectFixture(import.meta.url, "full.xml")
    expect(normalize(roundTrip(referenceXML))).toBe(normalize(readFileSync(join(import.meta.dirname, "__fixtures__/full.xml"), "utf8")))
  })

  it("preserves reference root xsi:type", () => {
    const source = readFileSync(
      join(import.meta.dirname, "../../appliedObjects/metadataChartOfAccounts/__fixtures__/sync/xml/ПланСчетовВсеСвойства/Ext/Predefined.xml"),
      "utf8"
    )
    const result = roundTrip(importContentFromXML<Record<string, unknown>>(source))
    expect(result).toContain('xsi:type="ChartOfAccountsPredefinedItems"')
    expect(normalize(result)).toBe(normalize(source))
  })

  it("exports chart of characteristic types predefined root xsi:type", () => {
    const result = serializeDirectXML(
      testMetadataItemFromYAMLToXML({
        rule: PredefinedRules,
        ownerYAML: { itemType: "MetadataChartOfCharacteristicTypes" },
        yaml: {
          ПредопределенноеВсеСвойства: { Код: "000000001", Наименование: "Предопределенное все свойства" },
        },
      }).xml
    )
    expect(result).toContain('xsi:type="PlanOfCharacteristicKindPredefinedItems"')
  })
})

function convertYAML(yaml: unknown): string {
  return serializeDirectXML(testMetadataItemFromYAMLToXML({ rule: PredefinedRules, yaml }).xml)
}

function roundTrip(referenceXML: Record<string, unknown>): string {
  const contexts = createDirectRoundTripContexts()
  const yaml = testMetadataItemFromXMLToYAML({
    context: contexts.importContext,
    rule: PredefinedRules,
    xml: referenceXML,
  }).yaml
  return serializeDirectXML(
    testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: PredefinedRules,
      yaml,
      referenceXML,
    }).xml
  )
}

const normalize = (value: string): string =>
  value
    .replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "")
    .replace(/\r\n/g, "\n")
    .trim()
