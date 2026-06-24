import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/metadata/commonObjects/color/__fixtures__/data"
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

  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("should preserve raw XML color ref %s", (rawRef) => {
    const result = { Color: exportColorToXML(mockContext, mockRule, { rawRef }) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(`<Color>${rawRef}</Color>`)
  })
})
