import { describe, expect, it } from "vitest"
import { absoluteColor, styleColor, webColor, winColor } from "~/tests/fixtures/color/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportColorToXML } from "./exportToXML"
import { importColorFromXML } from "./importFromXML"
import { ColorXML } from "./types"

describe("exportColorToXML", () => {
  it("should export absolute color to XML", () => {
    const expectedResult = readXMLFileAsString("color/absolute.xml")

    const result = { Color: exportColorToXML(mockСontext, absoluteColor) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export Windows color to XML", () => {
    const expectedResult = readXMLFileAsString("color/win.xml")

    const result = { Color: exportColorToXML(mockСontext, winColor) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export Web color to XML", () => {
    const expectedResult = readXMLFileAsString("color/web.xml")

    const result = { Color: exportColorToXML(mockСontext, webColor) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export style color to XML", () => {
    const expectedResult = readXMLFileAsString("color/style.xml")

    const result = { Color: exportColorToXML(mockСontext, styleColor) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportColorToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import absolute color correctly (round-trip)", () => {
    const originalXml = readXMLFileAsString("color/absolute.xml")

    const xml = readAndParseXMLFile<{ Color: ColorXML }>("color/absolute.xml")
    const imported = importColorFromXML(mockСontext, xml.Color)
    const exported = exportColorToXML(mockСontext, imported)
    const resultXml = xmlExport({ Color: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
