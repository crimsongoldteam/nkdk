import { describe, expect, it } from "vitest"
import { fullPages, minimalPages } from "~/tests/fixtures/forms/pages/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPagesToXML } from "./exportToXML"

describe("exportPagesToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPagesToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pages/full.xml")
    const xmlData = exportPagesToXML(mockContext, mockRule, fullPages)

    const result = xmlExport({ Pages: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pages/minimal.xml")
    const xmlData = exportPagesToXML(mockContext, mockRule, minimalPages)

    const result = xmlExport({ Pages: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
