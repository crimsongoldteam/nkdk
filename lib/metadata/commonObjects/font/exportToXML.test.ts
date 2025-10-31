import { expect, it, describe } from "vitest"
import { exportFontToXML } from "./exportToXML"
import { importFontFromXML } from "./importFromXML"
import { TFont, TFontXML, ZFontXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportFontToXML", () => {
  it("should export font to XML", () => {
    const expectedResult = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

    const mockFont: TFont = {
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

    const xml = xmlImport<{ Font: TFontXML }>(originalXml, z.object({ Font: ZFontXML }))
    const imported = importFontFromXML(xml.Font)
    const exported = exportFontToXML(imported)
    const resultXml = xmlExport({ Font: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
