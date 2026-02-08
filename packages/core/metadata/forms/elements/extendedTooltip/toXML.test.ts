import { describe, expect, it } from "vitest"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportExtendedTooltipToXML } from "./toXML"

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const context = {
      ...mockContext,
      elementContext: {
        name: "КакойТоЭлемент",
      },
    }
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/defaults.xml")

    const xmlData = exportExtendedTooltipToXML(context, mockRule, undefined)

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const context = {
      ...mockContext,
      elementContext: {
        name: "КакойТоЭлемент",
      },
    }
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/full.xml").trimEnd()

    const xmlData = exportExtendedTooltipToXML(context, mockRule, fullExtendedTooltip)

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
