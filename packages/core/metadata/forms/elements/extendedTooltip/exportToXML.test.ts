import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportExtendedTooltipToXML", () => {
  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/defaults.xml")

    const xmlData = exportElementToXML({ context: mockContext, element: undefined })

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/extendedTooltip/full.xml").trimEnd()
    const xmlData = exportElementToXML({ context: mockContext, element: fullExtendedTooltip })

    const result = xmlExport({ ExtendedTooltip: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
