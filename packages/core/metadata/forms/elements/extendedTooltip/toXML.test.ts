import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { ExtendedTooltip } from "./types"

const rule: PropertyRule<ExtendedTooltip> = { type: "ExtendedTooltip" }

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
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
    const context: ConfigurationContext = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
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
