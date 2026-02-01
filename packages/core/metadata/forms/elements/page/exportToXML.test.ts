import { describe, expect, it } from "vitest"
import { fullPage, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPageToXML } from "./exportToXML"

describe("exportPageToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPageToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/page/full.xml")
    const xmlData = exportPageToXML(mockContext, fullPage)

    const result = xmlExport({ Page: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/page/minimal.xml")
    const xmlData = exportPageToXML(mockContext, minimalPage)

    const result = xmlExport({ Page: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
