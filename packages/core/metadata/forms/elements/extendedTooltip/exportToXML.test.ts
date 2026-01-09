import { describe, expect, it } from "vitest"
import { parentElement, withContentExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportExtendedTooltipToXML } from "./exportToXML"

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/minimal.xml").trimEnd()

    const xmlData = exportExtendedTooltipToXML(mockСontext, undefined, parentElement)

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return content when data is not default", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/withContentExtendedTooltip.xml").trimEnd()
    const xmlData = exportExtendedTooltipToXML(mockСontext, withContentExtendedTooltip, parentElement)

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
