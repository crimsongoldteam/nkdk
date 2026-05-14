import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { PredefinedRules } from "./rules"

import "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export Predefined to XML", () => {
  it("round-trip from full.xml", () => {
    const source = readXMLFixtureAsString(import.meta.url, "full.xml")
    const imported = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: PredefinedRules,
      xmlString: source,
    })
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: PredefinedRules,
      xmlString: source,
    })
    const xmlObj = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: imported,
      referenceData: reference,
      rule: PredefinedRules,
    })
    const exported = xmlExport(xmlObj!)
    expect(exported).toEqual(source.trimEnd())
  })

  it("preserves reference root xsi:type", () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        "../../appliedObjects/metadataChartOfAccounts/__fixtures__/sync/xml/ПланСчетовВсеСвойства/Ext/Predefined.xml"
      ),
      "utf-8"
    )
    const imported = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: PredefinedRules,
      xmlString: source,
    })
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: PredefinedRules,
      xmlString: source,
    })
    const xmlObj = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: imported,
      referenceData: reference,
      rule: PredefinedRules,
    })
    const exported = xmlExport(xmlObj!)

    expect(exported).toContain('xsi:type="ChartOfAccountsPredefinedItems"')
    expect(normalizeLineEndings(exported)).toEqual(normalizeLineEndings(source.trimEnd()))
  })
})
