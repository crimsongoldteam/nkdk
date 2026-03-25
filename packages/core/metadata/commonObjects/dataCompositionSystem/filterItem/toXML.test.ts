import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { FilterItemComparisonRules } from "./rules"
import { fullFilterItemComparison } from "./__fixtures__/data"

describe("export FilterItemComparison to XML", () => {
  it("should export full to XML", () => {
    const exported = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: fullFilterItemComparison,
      rule: FilterItemComparisonRules,
    })

    const wrapped = {
      "dcsset:item": {
        "_xsi:type": "dcsset:FilterItemComparison",
        ...exported,
      },
    }

    const result = xmlExport(wrapped, false)
    const expectedXml = readXMLFixtureAsString(import.meta.url, "full.xml")

    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedXml))
  })
})
