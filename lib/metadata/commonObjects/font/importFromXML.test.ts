import { describe, expect, it } from "vitest"
import z from "zod"
import { xmlImport } from "~/lib"
import { importFontFromXML } from "./importFromXML"
import { type TFont, type TFontXML, ZFontXML } from "./types"

describe("importFontFromXML", () => {
  it("should import font from XML with all properties", () => {
    const mockXml = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

    const mockResult: TFont = {
      ref: "sys:ANSIVariableFont",
      height: 12,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
      kind: "WindowsFont",
    }

    const xml = xmlImport<{ Font: TFontXML }>(mockXml, z.object({ Font: ZFontXML }))
    const value = xml.Font

    const result = importFontFromXML(value)

    expect(result).toEqual(mockResult)
  })
})
