import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullButtonGroup, minimalButtonGroup } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportButtonGroupToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/buttonGroup/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullButtonGroup })

    const result = xmlExport({ ButtonGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/buttonGroup/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalButtonGroup })

    const result = xmlExport({ ButtonGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
