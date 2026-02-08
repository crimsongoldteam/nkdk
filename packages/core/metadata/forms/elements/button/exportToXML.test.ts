import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportButtonToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/button/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullButton })

    const result = xmlExport({ Button: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/button/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalButton })

    const result = xmlExport({ Button: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
