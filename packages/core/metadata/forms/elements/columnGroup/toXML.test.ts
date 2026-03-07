import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullColumnGroup, minimalColumnGroup } from "~/tests/fixtures/forms/columnGroup/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportColumnGroupToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/columnGroup/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullColumnGroup })

    const result = xmlExport({ ColumnGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/columnGroup/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalColumnGroup })

    const result = xmlExport({ ColumnGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
