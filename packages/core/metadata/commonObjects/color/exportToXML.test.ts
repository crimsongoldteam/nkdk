import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportColorToXML } from "./exportToXML"

describe("exportColorToXML", () => {
  it.each(colorTestCases.filter((testCase) => testCase.fixture))("should export $name to XML", ({ color, fixture }) => {
    const expectedResult = readXMLFileAsString(fixture!)

    const result = { Color: exportColorToXML(mockСontext, color) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportColorToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
