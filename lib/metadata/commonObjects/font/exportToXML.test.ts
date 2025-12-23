import { describe, expect, it } from "vitest"
import { xmlExport, xmlImport } from "~/lib"
import { mockСontext } from "~/lib/tests/mockContext"
import { exportFontToXML } from "./exportToXML"
import { importFontFromXML } from "./importFromXML"
import { Font, FontXML } from "./types"

describe("exportFontToXML", () => {
  it("should export font to XML", () => {
    const expectedResult = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

    const mockFont: Font = {
      ref: "sys:ANSIVariableFont",
      height: 12,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
      kind: "WindowsFont",
    }

    const result = { Font: exportFontToXML(mockСontext, mockFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import font correctly (round-trip)", () => {
    const originalXml = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

    const xml = xmlImport<{ Font: FontXML }>(originalXml)
    const imported = importFontFromXML(mockСontext, xml.Font)
    const exported = exportFontToXML(mockСontext, imported)
    const resultXml = xmlExport({ Font: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
