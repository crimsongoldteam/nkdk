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

  it("exports fields in 1C-loadable order without reference", () => {
    const xmlObj = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: {
        itemType: "AdditionalIndex",
        items: [
          {
            itemType: "AdditionalIndexItem",
            id: "11111111-1111-4111-8111-111111111111",
            name: "ОдинИндекс",
            table: "Catalog.СправочникПолный",
            indexedFields: ["Code"],
            additionalFields: ["Ref"],
          },
        ],
      },
      rule: AdditionalIndexRules,
    })
    const exported = xmlExport(xmlObj!)
    expect(exported).toContain(
      [
        '\t<AdditionalIndex id="11111111-1111-4111-8111-111111111111">',
        "\t\t<Name>ОдинИндекс</Name>",
        "\t\t<Table>Catalog.СправочникПолный</Table>",
        "\t\t<IndexedFields>",
        "\t\t\t<Field>Code</Field>",
        "\t\t</IndexedFields>",
        "\t\t<AdditionalFields>",
        "\t\t\t<Field>Ref</Field>",
        "\t\t</AdditionalFields>",
        "\t</AdditionalIndex>",
      ].join("\n")
    )
  })
})
