import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { content } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("export ExchangePlanContent to XML", () => {
  it("round-trips content items with Allow and Deny auto record", () => {
    const source = readXMLFixtureAsString(import.meta.url, "content.xml")
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: ExchangePlanContentRules,
      xmlString: source,
    })

    const xmlObj = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: content,
      referenceData: reference,
      rule: ExchangePlanContentRules,
    })
    const exported = xmlExport(xmlObj!)

    expect(exported).toEqual(source.trimEnd())
  })
})
