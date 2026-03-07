import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

const rule: PropertyRule = { type: "ExtendedTooltip" }

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const context: ConfigurationContextWithExportToXML = {
      ...mockContextToXML(),
      exportToXML: {
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
        configDumpInfo: new Map(),
        version: "2.20",
      },
    }
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/defaults.xml")

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: undefined,
    })

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const context: ConfigurationContextWithExportToXML = {
      ...mockContextToXML(),
      exportToXML: {
        itemsTree: [{ name: "КакойТоЭлемент", itemType: "Table", path: "Table" }],
        configDumpInfo: new Map(),
        version: "2.20",
      },
    }
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/full.xml").trimEnd()

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: fullExtendedTooltip,
    })

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
