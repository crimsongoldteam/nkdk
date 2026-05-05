import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { AdditionalIndexRules } from "./rules"

import "./types"

describe("export AdditionalIndex to XML", () => {
  it("round-trip from full.xml", () => {
    const source = readXMLFixtureAsString(import.meta.url, "full.xml")
    const imported = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: AdditionalIndexRules,
      xmlString: source,
    })
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: AdditionalIndexRules,
      xmlString: source,
    })
    const xmlObj = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: imported,
      referenceData: reference,
      rule: AdditionalIndexRules,
    })
    const exported = xmlExport(xmlObj!)
    expect(exported).toEqual(source.trimEnd())
  })
})
