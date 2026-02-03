import { describe, expect, it } from "vitest"
import { fullExtendedTooltip, parentElement } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportExtendedTooltipToXML } from "./exportToXML"

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/defaults.xml")

    const xmlData = exportExtendedTooltipToXML(mockContext, mockRule, undefined, parentElement)

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/full.xml").trimEnd()
    const xmlData = exportExtendedTooltipToXML(mockContext, mockRule, fullExtendedTooltip, parentElement)

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
