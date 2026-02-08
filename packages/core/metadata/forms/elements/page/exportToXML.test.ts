import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullPage, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPageToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/page/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullPage })

    const result = xmlExport({ Page: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/page/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalPage })

    const result = xmlExport({ Page: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
