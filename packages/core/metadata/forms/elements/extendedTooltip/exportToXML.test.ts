import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullExtendedTooltip, parentElement } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportElementToXML } from "~/metadata/metadataFactory"

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/defaults.xml")

    const xmlData = exportElementToXML({ context: mockContext, data: undefined })

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/full.xml").trimEnd()
    const xmlData = exportElementToXML({ context: mockContext, data: fullExtendedTooltip })

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
