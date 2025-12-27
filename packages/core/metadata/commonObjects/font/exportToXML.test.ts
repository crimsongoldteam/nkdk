import { describe, expect, it } from "vitest"
import { xmlExport, xmlImport } from "~/packages/core"
import { system } from "~/packages/core/tests/fixtures/font/system"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { readXMLFileAsString } from "~/packages/core/tests/readAndParseXMLFile"
import { exportFontToXML } from "./exportToXML"
import { importFontFromXML } from "./importFromXML"
import { FontXML } from "./types"

describe("exportFontToXML", () => {
  it("should export font to XML", () => {
    const expectedResult = readXMLFileAsString("font/full.xml")

    const result = { Font: exportFontToXML(mockСontext, system) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import font correctly (round-trip)", () => {
    const originalXml = readXMLFileAsString("font/full.xml")

    const xml = xmlImport<{ Font: FontXML }>(originalXml)
    const imported = importFontFromXML(mockСontext, xml.Font)
    const exported = exportFontToXML(mockСontext, imported)
    const resultXml = xmlExport({ Font: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
