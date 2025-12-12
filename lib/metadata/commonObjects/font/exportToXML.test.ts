import { expect, it, describe } from "vitest"
import { exportFontToXML } from "./exportToXML"
import { importFontFromXML } from "./importFromXML"
import { xmlExport, xmlImport } from "~/lib"
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

    const result = { Font: exportFontToXML(mockFont) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import font correctly (round-trip)", () => {
    const originalXml = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

    const xml = xmlImport<{ Font: FontXML }>(originalXml)
    const imported = importFontFromXML(xml.Font)
    const exported = exportFontToXML(imported)
    const resultXml = xmlExport({ Font: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
