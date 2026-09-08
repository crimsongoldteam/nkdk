import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  serializeDirectXML,
  testMetadataItemFromYAMLToXML,
  testMetadataItemYamlRoundTrip,
} from "../../../tests/directConversion"
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
    const source = readFileSync(join(import.meta.dirname, "__fixtures__/full.xml"), "utf8")
    expect(normalize(roundTrip(source))).toBe(normalize(source))
  })

  it("восстанавливает xsi:type по владельцу — плану счетов", () => {
    const source = readFileSync(
      join(import.meta.dirname, "../../appliedObjects/metadataChartOfAccounts/__fixtures__/sync/xml/ПланСчетовВсеСвойства/Ext/Predefined.xml"),
      "utf8"
    )
    const result = roundTrip(source, { itemType: "MetadataChartOfAccounts" })
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

function roundTrip(source: string, ownerYAML?: unknown): string {
  return testMetadataItemYamlRoundTrip({ rule: PredefinedRules, sourceXML: source, ownerYAML }).result
}

const normalize = (value: string): string =>
  value
    .replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "")
    .replace(/\r\n/g, "\n")
    .trim()
