import { describe, expect, it } from "vitest"
import {
  normalFullFont,
  normalMinimalFont,
  styleFullFont,
  styleMinimalFont,
  systemFullFont,
  systemMinimalFont,
} from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFontToXML } from "./exportToXML"

describe("exportFontToXML", () => {
  it("should export normal minimal font to XML", () => {
    const expectedResult = readXMLFileAsString("font/normalMinimal.xml")

    const result = { Font: exportFontToXML(mockСontext, normalMinimalFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export system minimal font to XML", () => {
    const expectedResult = readXMLFileAsString("font/systemMinimal.xml")

    const result = { Font: exportFontToXML(mockСontext, systemMinimalFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export style minimal font to XML", () => {
    const expectedResult = readXMLFileAsString("font/styleMinimal.xml")

    const result = { Font: exportFontToXML(mockСontext, styleMinimalFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export normal full font to XML", () => {
    const expectedResult = readXMLFileAsString("font/normalFull.xml")

    const result = { Font: exportFontToXML(mockСontext, normalFullFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export style full font to XML", () => {
    const expectedResult = readXMLFileAsString("font/styleFull.xml")

    const result = { Font: exportFontToXML(mockСontext, styleFullFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export system full font to XML", () => {
    const expectedResult = readXMLFileAsString("font/systemFull.xml")

    const result = { Font: exportFontToXML(mockСontext, systemFullFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
