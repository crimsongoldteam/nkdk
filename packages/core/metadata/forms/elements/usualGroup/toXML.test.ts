import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullUsualGroup, minimalUsualGroup } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportUsualGroupToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/usualGroup/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullUsualGroup })

    const result = xmlExport({ UsualGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/usualGroup/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalUsualGroup })

    const result = xmlExport({ UsualGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
