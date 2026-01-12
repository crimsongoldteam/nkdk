import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullTable, minimalTable } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportTableToXML } from "./exportToXML"

describe("exportTableToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTableToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/table/full.xml")
    const xmlData = exportTableToXML(mockСontext, fullTable)

    const result = xmlExport({ Table: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/table/minimal.xml")
    const xmlData = exportTableToXML(mockСontext, minimalTable)

    const result = xmlExport({ Table: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
