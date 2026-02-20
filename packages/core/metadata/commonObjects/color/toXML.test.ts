import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportColorToXML } from "./toXML"

describe("exportColorToXML", () => {
  it.each(colorTestCases.filter((testCase) => testCase.fixture))("should export $name to XML", ({ color, fixture }) => {
    const expectedResult = readXMLFileAsString(fixture!)

    const result = { Color: exportColorToXML(mockContext, mockRule, color) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportColorToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
